import { COMMON_WGSL } from '../../../material/common.wgsl'
import { GBUFFER_WGSL } from '../../../material/gbuffer.wgsl'
import { PROBES_WGSL } from '../../../material/probes.wgsl'

export const LIGHTING_WORKGROUP_SIZE = 8

/**
 * Debug modes of the lighting pass (params.x)
 */
export const LightingDebugModes = ['off', 'edges'] as const
export type LightingDebugMode = (typeof LightingDebugModes)[number]

/**
 * Deferred lighting of the GBuffer (tmp/render-pipeline/plan.md, steps 4.1 and 4.2).
 *
 * Shades with the lighting code of the forward materials (sun, cluster lights, probes, transmittance model), composed
 * like Illum and TerrainPatch, and resolves into the single sample HDR color:
 * - every pixel shades sample 0
 * - with MSAA, pixels whose samples differ (depth, normal, albedo, lighting model) are edges. Their other samples go
 *   into a per tile list that the whole workgroup shades, so the extra work is spread over all threads.
 * - the samples are resolved with tone map weights (1 / (1 + max(rgb))), so bright samples don't dominate the edge
 * - samples without geometry take the sky, which is drawn before this pass. The horizon stays antialiased.
 * - the scene linear depth is resolved too: the farthest sample, samples without geometry count as the far plane
 *   (the sky depth of the forward pipeline)
 *
 * Group 0 repeats the global declarations of the materials, so the render input blocks bind it the same way.
 */
export function lightingWgsl(samples: 1 | 4): string {
  const msaa = samples > 1
  const textureType = msaa ? 'texture_multisampled_2d<f32>' : 'texture_2d<f32>'
  // sample index of multisampled textures, mip level of single sample textures
  const index = msaa ? 'i32(s)' : '0'
  const tilePixels = LIGHTING_WORKGROUP_SIZE * LIGHTING_WORKGROUP_SIZE
  return /* wgsl */ `
${COMMON_WGSL}

// @private
@group(0) @binding(0) var<uniform> global : GlobalBlock;
// @private
@group(0) @binding(1) var<uniform> view   : ViewBlock;
// @private
@group(0) @binding(3) var<uniform> lights : LightBlock;
// @block global
// @private
@group(0) @binding(4) var envMap          : texture_cube<f32>;

${PROBES_WGSL}
${GBUFFER_WGSL}

struct LightingParams {
  values: vec4f, // x = debug mode
};

@group(1) @binding(0) var gbufferA    : ${textureType};
@group(1) @binding(1) var gbufferB    : ${textureType};
@group(1) @binding(2) var gbufferC    : ${textureType};
@group(1) @binding(3) var linearDepth : ${textureType};
@group(1) @binding(4) var skyColor    : texture_2d<f32>;
@group(1) @binding(5) var envSampler  : sampler;
@group(1) @binding(6) var outColor    : texture_storage_2d<rgba16float, write>;
@group(1) @binding(7) var outDepth    : texture_storage_2d<r32float, write>;
@group(1) @binding(8) var<uniform> params : LightingParams;

const SAMPLES: u32 = ${samples}u;
const TILE: u32 = ${LIGHTING_WORKGROUP_SIZE}u;
const TILE_PIXELS: u32 = ${tilePixels}u;
// edge classification: relative depth difference, normal cosine, sqrt albedo difference
const EDGE_DEPTH: f32 = 0.01;
const EDGE_NORMAL: f32 = 0.95;
const EDGE_ALBEDO: f32 = 0.06;

// shaded color of each sample of the tile's pixels
var<workgroup> sampleColors : array<vec3f, ${tilePixels * samples}>;
// extra samples of edge pixels: local pixel index << 2 | sample index
var<workgroup> edgeSamples  : array<u32, ${Math.max(1, tilePixels * (samples - 1))}>;
var<workgroup> edgeCount    : atomic<u32>;
var<workgroup> edgeTotal    : u32;

fn loadA(p: vec2i, s: u32) -> vec4f { return textureLoad(gbufferA, p, ${index}); }
fn loadB(p: vec2i, s: u32) -> vec4f { return textureLoad(gbufferB, p, ${index}); }
fn loadC(p: vec2i, s: u32) -> vec4f { return textureLoad(gbufferC, p, ${index}); }
fn loadDepth(p: vec2i, s: u32) -> f32 { return textureLoad(linearDepth, p, ${index}).r; }

// world position of a pixel at a linear view depth
fn lightingWorldPos(fragCoord: vec2f, viewDepth: f32) -> vec3f {
  // the far plane lies at the view depth view.far
  let farPos = farPlaneWorldPos(fragCoord);
  return view.cameraPosition + (farPos - view.cameraPosition) * (viewDepth / view.far);
}

// same composition as the forward Illum and TerrainPatch materials (fs_main)
fn shadeGBuffer(g: GBufferSurface, worldPos: vec3f) -> vec3f {
  let toEye = normalize(view.cameraPosition - worldPos);
  let normal = g.normal;
  let gloss = g.smoothness;

  var surface: SurfaceParams;
  // the GBuffer has no forward back color (normalViewDependency), only the transmittance model
  surface.Transmittance = vec4f(g.transmittance, 0.0);
  surface.LightingModel = g.lightingModel;
  surface.Diffuse   = g.albedo;
  surface.Alpha     = 1.0;
  surface.Specular  = g.reflectance;
  surface.Normal    = vec4f(normal, 1.0);
  surface.Roughness = smoothnessToRoughness(gloss);

  let reflectVec = normalize(reflect(-toEye, normal));
  let reflectColor = environmentSpecular(envSampler, reflectVec, gloss);

  let ambient = vec3f(g.occlusion);
  var shade = accumulateLightShade(lights, global, surface, toEye, worldPos);
  shade.ambient += environmentDiffuse(envSampler, normal) * ambient;
  let envFresnel = environmentFresnel(surface.Specular.rgb, gloss, dot(normal, toEye));
  shade.specular += reflectColor * ambient * envFresnel * shade.ambientScale;
  return composeShade(surface, shade);
}

// lit color of one sample, the sky where the sample has no geometry
fn shadeSample(p: vec2i, s: u32) -> vec3f {
  let depth = loadDepth(p, s);
  if (depth <= 0.0) {
    return textureLoad(skyColor, p, 0).rgb;
  }
  let g = decodeGBuffer(loadA(p, s), loadB(p, s), loadC(p, s));
  // all samples of a fragment share its attributes, which are evaluated at the pixel center
  return shadeGBuffer(g, lightingWorldPos(vec2f(p) + 0.5, depth));
}

struct PixelInfo {
  edge  : bool,
  depth : f32, // resolved linear depth: farthest sample, the far plane without geometry
};

fn classifyPixel(p: vec2i) -> PixelInfo {
  var info: PixelInfo;
  let d0 = loadDepth(p, 0u);
  info.depth = select(view.far, d0, d0 > 0.0);
  if (SAMPLES == 1u) {
    return info;
  }
  let a0 = loadA(p, 0u);
  let b0 = loadB(p, 0u);
  let n0 = gbufferDecodeNormal(a0.xy);
  for (var s = 1u; s < SAMPLES; s++) {
    let d = loadDepth(p, s);
    info.depth = max(info.depth, select(view.far, d, d > 0.0));
    if (info.edge) {
      continue;
    }
    if ((d > 0.0) != (d0 > 0.0)) {
      info.edge = true;
      continue;
    }
    if (d <= 0.0) {
      continue;
    }
    let a = loadA(p, s);
    let b = loadB(p, s);
    info.edge = abs(d - d0) > EDGE_DEPTH * max(d, d0)
      || abs(a.w - a0.w) > 0.1
      || dot(gbufferDecodeNormal(a.xy), n0) < EDGE_NORMAL
      || any(abs(b.rgb - b0.rgb) > vec3f(EDGE_ALBEDO));
  }
  return info;
}

fn resolveWeight(c: vec3f) -> f32 {
  return 1.0 / (1.0 + max(c.r, max(c.g, c.b)));
}

@compute @workgroup_size(${LIGHTING_WORKGROUP_SIZE}, ${LIGHTING_WORKGROUP_SIZE})
fn main(
  @builtin(global_invocation_id) id: vec3u,
  @builtin(workgroup_id) group: vec3u,
  @builtin(local_invocation_index) local: u32,
) {
  if (local == 0u) {
    atomicStore(&edgeCount, 0u);
  }
  workgroupBarrier();

  let size = textureDimensions(outColor);
  let inside = id.x < size.x && id.y < size.y;
  let p = vec2i(id.xy);
  var info: PixelInfo;
  if (inside) {
    info = classifyPixel(p);
    sampleColors[local * SAMPLES] = shadeSample(p, 0u);
    if (info.edge) {
      let base = atomicAdd(&edgeCount, SAMPLES - 1u);
      for (var s = 1u; s < SAMPLES; s++) {
        edgeSamples[base + s - 1u] = (local << 2u) | s;
      }
    }
  }
  workgroupBarrier();
  if (local == 0u) {
    edgeTotal = atomicLoad(&edgeCount);
  }
  // uniform, so the loop bound keeps the barrier below in uniform control flow
  let count = workgroupUniformLoad(&edgeTotal);

  // the whole workgroup shades the extra samples of the edge pixels
  let origin = group.xy * TILE;
  for (var first = 0u; first < count; first += TILE_PIXELS) {
    let i = first + local;
    if (i < count) {
      let entry = edgeSamples[i];
      let pixel = entry >> 2u;
      let s = entry & 3u;
      let q = vec2i(origin + vec2u(pixel % TILE, pixel / TILE));
      sampleColors[pixel * SAMPLES + s] = shadeSample(q, s);
    }
  }
  workgroupBarrier();

  if (!inside) {
    return;
  }
  var color = sampleColors[local * SAMPLES];
  if (info.edge) {
    var sum = vec3f(0.0);
    var weights = 0.0;
    for (var s = 0u; s < SAMPLES; s++) {
      let c = sampleColors[local * SAMPLES + s];
      let w = resolveWeight(c);
      sum += c * w;
      weights += w;
    }
    color = sum / weights;
    if (u32(params.values.x) == 1u) {
      color = mix(color, vec3f(4.0, 0.0, 0.0), 0.5);
    }
  }
  textureStore(outColor, p, vec4f(color, 1.0));
  textureStore(outDepth, p, vec4f(info.depth, 0.0, 0.0, 0.0));
}
`
}
