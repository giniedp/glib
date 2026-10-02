import { FULLSCREEN_WGSL_VS } from '@gglib/effects'

/**
 * Deferred volumetric fog, matches `applyFog` in material/common.wgsl.ts
 *
 * Outputs premultiplied fog color and the scene transmittance in alpha.
 * Meant to be used with blending `dst = src.rgb + dst.rgb * src.a`
 */
const FOG_COMMON = /* wgsl */ `
${FULLSCREEN_WGSL_VS}

struct FogParams {
  // view to world transform of the camera
  cameraWorld                    : mat4x4f,
  // mul.xy, add.xy to reconstruct view space xy from uv and linear depth
  ndcToView                      : vec4f,
  // width, height, 1/width, 1/height
  viewport                       : vec4f,
  // x = max depth, pixels at or beyond are not fogged (sky)
  depthRange                     : vec4f,
  volumetricFogParams            : vec4f,
  volumetricFogRampParams        : vec4f,
  volumetricFogColorGradientBase : vec4f,
};

@group(0) @binding(0) var<uniform> params: FogParams;

fn computeVolumetricFogInternal(cameraToWorldPos: vec3f) -> f32 {
  let heightScale                 = params.volumetricFogParams.x;
  let volFogHeightDensityAtViewer = params.volumetricFogParams.y;
  let densityClamp                = params.volumetricFogParams.w;

  var fogInt = 1.0;
  let t = heightScale * cameraToWorldPos.z;
  if (abs(t) > 0.01) {
    fogInt *= (exp(t) - 1.0) / t;
  }

  let l = length(cameraToWorldPos);
  let u = l * volFogHeightDensityAtViewer;
  fogInt *= u;

  var f = saturate(exp2(-fogInt));
  var r = saturate(l * params.volumetricFogRampParams.x + params.volumetricFogRampParams.y);
  r = r * (2 - r);
  r = r * params.volumetricFogRampParams.z + params.volumetricFogRampParams.w;

  f = (1.0 - f) * r;
  return max(1.0 - f, densityClamp);
}

fn computeFog(position: vec2f, depth: f32) -> vec4f {
  if (depth <= 0.0 || depth >= params.depthRange.x) {
    return vec4f(0.0, 0.0, 0.0, 1.0);
  }
  let uv = (floor(position) + 0.5) * params.viewport.zw;
  let viewPos = vec3f((params.ndcToView.xy * uv + params.ndcToView.zw) * depth, -depth);
  let cameraToWorldPos = (params.cameraWorld * vec4f(viewPos, 0.0)).xyz;
  let factor = computeVolumetricFogInternal(cameraToWorldPos);
  return vec4f(params.volumetricFogColorGradientBase.rgb * (1.0 - factor), factor);
}
`

/**
 * Fog for single sampled targets
 */
export const FOG_WGSL = /* wgsl */ `
${FOG_COMMON}

@group(0) @binding(1) var depthMap: texture_2d<f32>;

@fragment
fn fs_main(in: FragmentInput) -> @location(0) vec4f {
  let depth = textureLoad(depthMap, vec2i(in.position.xy), 0).r;
  return computeFog(in.position.xy, depth);
}
`

/**
 * Fog for multisampled targets, shaded per sample
 */
export const FOG_MSAA_WGSL = /* wgsl */ `
${FOG_COMMON}

@group(0) @binding(1) var depthMap: texture_multisampled_2d<f32>;

@fragment
fn fs_main(in: FragmentInput, @builtin(sample_index) sampleIndex: u32) -> @location(0) vec4f {
  let depth = textureLoad(depthMap, vec2i(in.position.xy), i32(sampleIndex)).r;
  return computeFog(in.position.xy, depth);
}
`
