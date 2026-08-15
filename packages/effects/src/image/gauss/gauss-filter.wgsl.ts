import { FULLSCREEN_WGSL_VS } from '../common.wgsl'

const BASE = /* wgsl */ `
struct Uniforms {
  offsetWeights : array<vec4f, 9>,
  threshold : f32,
  multiplier : f32,
};

@group(0) @binding(0)
var<uniform> params : Uniforms;

@group(0) @binding(1)
var texture1 : texture_2d<f32>;

@group(0) @binding(2)
var texture1Sampler : sampler;

@group(0) @binding(3)
var texture2 : texture_2d<f32>;

@group(0) @binding(4)
var texture2Sampler : sampler;

fn hBlur(uv: vec2f) -> vec4f {
  var color = vec4f(0.0);
  for (var i: i32 = 0; i < 9; i = i + 1) {
    let offset = params.offsetWeights[i];
    color += textureSample(texture1, texture1Sampler, uv + vec2f(offset.x, 0.0)) * offset.z;
  }
  return color;
}

fn vBlur(uv: vec2f) -> vec4f {
  var color = vec4f(0.0);
  for (var i: i32 = 0; i < 9; i = i + 1) {
    let offset = params.offsetWeights[i];
    color += textureSample(texture1, texture1Sampler, uv + vec2f(0.0, offset.y)) * offset.w;
  }
  return color;
}
`
export const BLOOM_WGSL_HBLUR = /* wgsl */ `
${FULLSCREEN_WGSL_VS}
${BASE}

@fragment
fn fs(in: FragmentInput) -> @location(0) vec4f {
  return hBlur(in.uv);
}
`

export const BLOOM_WGSL_VBLUR = /* wgsl */ `
${FULLSCREEN_WGSL_VS}
${BASE}

@fragment
fn fs(in: FragmentInput) -> @location(0) vec4f {
  return vBlur(in.uv);
}
`
