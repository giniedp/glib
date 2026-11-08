import { COMMON_WGSL } from '../../../material/common.wgsl'
import { GBUFFER_WGSL } from '../../../material/gbuffer.wgsl'
import { PROBES_WGSL } from '../../../material/probes.wgsl'

export const LIGHTING_WORKGROUP_SIZE = 8

/**
 * Debug modes of the lighting pass (params.x)
 */
export const LightingDebugModes = ['off', 'ao'] as const
export type LightingDebugMode = (typeof LightingDebugModes)[number]

/**
 * Deferred lighting of the GBuffer (tmp/render-pipeline/plan.md, phases 4-6), one pixel per invocation.
 *
 * Shades with the lighting code of the forward materials (sun, cluster lights, probes, transmittance model), composed
 * like Illum and TerrainPatch, into the HDR color:
 * - pixels without geometry (linear depth 0, the GBuffer clear) are skipped, the sky is drawn after this pass
 * - screen space AO (XeGTAO, before this pass) occludes the probe lighting like the game's SSDO (tiledshading.cfi):
 *   diffuse by min(material occlusion, ao), specular by DeriveSpecularOcclusion. Direct light is not occluded (the
 *   game only occludes it with SSDO bent normals, which XeGTAO does not produce here).
 *
 * Group 0 repeats the global declarations of the materials, so the render input blocks bind it the same way.
 */
export const LIGHTING_WGSL = /* wgsl */ `
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
  values: vec4f, // x = debug mode, y = 1 when the AO map is bound, z = AO strength
};

@group(1) @binding(0) var gbufferA    : texture_2d<f32>;
@group(1) @binding(1) var gbufferB    : texture_2d<f32>;
@group(1) @binding(2) var gbufferC    : texture_2d<f32>;
@group(1) @binding(3) var linearDepth : texture_2d<f32>;
@group(1) @binding(4) var envSampler  : sampler;
@group(1) @binding(5) var outColor    : texture_storage_2d<rgba16float, write>;
@group(1) @binding(6) var aoMap       : texture_2d<f32>;
@group(1) @binding(7) var<uniform> params : LightingParams;

// world position of a pixel at a linear view depth
fn lightingWorldPos(fragCoord: vec2f, viewDepth: f32) -> vec3f {
  // the far plane lies at the view depth view.far
  let farPos = farPlaneWorldPos(fragCoord);
  return view.cameraPosition + (farPos - view.cameraPosition) * (viewDepth / view.far);
}

// screen space ambient occlusion of a pixel, 1 = not occluded
fn loadAo(p: vec2i) -> f32 {
  if (params.values.y < 0.5) {
    return 1.0;
  }
  return mix(1.0, textureLoad(aoMap, p, 0).r, params.values.z);
}

// same composition as the forward Illum and TerrainPatch materials (fs_main), with the occlusion of the game
fn shadeGBuffer(g: GBufferSurface, worldPos: vec3f, ssao: f32) -> vec3f {
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

  // tiledshading.cfi (SSDO): diffuse min(material occlusion, ssdo²), XeGTAO's final value power stands in for the
  // square. The specular occlusion is derived from the same term.
  let occlusion = min(g.occlusion, ssao);
  var shade = accumulateLightShade(lights, global, surface, toEye, worldPos);
  let directSpecular = shade.specular;
  shade.ambient += environmentDiffuse(envSampler, normal) * occlusion;
  let NdotV = dot(normal, toEye);
  let envFresnel = environmentFresnel(surface.Specular.rgb, gloss, NdotV);
  let occlSpec = deriveSpecularOcclusion(NdotV, max(occlusion, 0.3), gloss);
  let reflection = reflectColor * occlSpec * envFresnel * shade.ambientScale;
  shade.specular += reflection;

  // shading debug views (the material views are drawn by the material debug pass)
  switch (global.debug) {
    case DEBUG_SH_DIFFUSE: {
      return shade.diffuse + shade.diffuseBack * surface.Transmittance.rgb;
    }
    case DEBUG_SH_SPECULAR: {
      return directSpecular;
    }
    case DEBUG_SH_SHADOW: {
      // no shadows yet (plan phase 8)
      return vec3f(1.0);
    }
    case DEBUG_SH_AMBIENT: {
      return shade.ambient * shade.ambientScale;
    }
    case DEBUG_SH_REFLECTION: {
      return reflection;
    }
    case DEBUG_SH_FRESNEL: {
      return envFresnel;
    }
    case DEBUG_SH_COUNT: {
      return lightCountHeatmap(worldPos);
    }
    default: {
      return composeShade(surface, shade);
    }
  }
}

// cluster light count as a heatmap: black none, blue 1, green 4, red 16 and more
fn lightCountHeatmap(worldPos: vec3f) -> vec3f {
  let clusterIndex = getLightClusterIndex(lights, worldPos);
  if (clusterIndex < 0) {
    return vec3f(0.0);
  }
  let count = f32(lightClusters[clusterIndex].count);
  if (count < 1.0) {
    return vec3f(0.0);
  }
  let t = saturate(log2(count) / 4.0);
  return select(mix(vec3f(0.0, 1.0, 0.0), vec3f(1.0, 0.0, 0.0), t * 2.0 - 1.0), mix(vec3f(0.0, 0.0, 1.0), vec3f(0.0, 1.0, 0.0), t * 2.0), t < 0.5);
}

@compute @workgroup_size(${LIGHTING_WORKGROUP_SIZE}, ${LIGHTING_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) id: vec3u) {
  let size = textureDimensions(outColor);
  if (id.x >= size.x || id.y >= size.y) {
    return;
  }
  let p = vec2i(id.xy);
  let depth = textureLoad(linearDepth, p, 0).r;
  // no geometry, the sky is drawn after the lighting
  if (depth <= 0.0) {
    textureStore(outColor, p, vec4f(0.0, 0.0, 0.0, 1.0));
    return;
  }
  let ssao = loadAo(p);
  let g = decodeGBuffer(textureLoad(gbufferA, p, 0), textureLoad(gbufferB, p, 0), textureLoad(gbufferC, p, 0));
  var color = shadeGBuffer(g, lightingWorldPos(vec2f(p) + 0.5, depth), ssao);
  if (u32(params.values.x) == 1u) {
    color = vec3f(ssao);
  }
  textureStore(outColor, p, vec4f(color, 1.0));
}
`
