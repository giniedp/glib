import { COMMON_WGSL } from '../../../material/common.wgsl'
import { GBUFFER_WGSL } from '../../../material/gbuffer.wgsl'
import { PROBES_WGSL } from '../../../material/probes.wgsl'

export const LIGHTING_WORKGROUP_SIZE = 8

/**
 * Deferred lighting of the single sample GBuffer (tmp/render-pipeline/plan.md, step 4.1).
 *
 * Shades every pixel with the lighting code of the forward materials (sun, cluster lights, probes, transmittance
 * model), composed like Illum and TerrainPatch. Pixels without geometry (linear depth 0) are cleared, the sky is drawn
 * by the forward stage after this pass.
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

@group(1) @binding(0) var gbufferA    : texture_2d<f32>;
@group(1) @binding(1) var gbufferB    : texture_2d<f32>;
@group(1) @binding(2) var gbufferC    : texture_2d<f32>;
@group(1) @binding(3) var linearDepth : texture_2d<f32>;
@group(1) @binding(4) var envSampler  : sampler;
@group(1) @binding(5) var outColor    : texture_storage_2d<rgba16float, write>;

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

@compute @workgroup_size(${LIGHTING_WORKGROUP_SIZE}, ${LIGHTING_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) id: vec3u) {
  let size = textureDimensions(outColor);
  if (id.x >= size.x || id.y >= size.y) {
    return;
  }
  let p = vec2i(id.xy);
  let viewDepth = textureLoad(linearDepth, p, 0).r;
  if (viewDepth <= 0.0) {
    textureStore(outColor, p, vec4f(0.0));
    return;
  }
  let g = decodeGBuffer(textureLoad(gbufferA, p, 0), textureLoad(gbufferB, p, 0), textureLoad(gbufferC, p, 0));
  let worldPos = lightingWorldPos(vec2f(id.xy) + 0.5, viewDepth);
  textureStore(outColor, p, vec4f(shadeGBuffer(g, worldPos), 1.0));
}
`
