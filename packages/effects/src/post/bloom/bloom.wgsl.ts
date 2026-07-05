const VERTEX = /* wgsl */ `
struct VSOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) uv : vec2<f32>,
};

@vertex
fn vs(@builtin(vertex_index) vertexIndex : u32) -> VSOutput {
  var pos = vec2<f32>(
    select(-1.0, 3.0, vertexIndex == 2u),
    select(-1.0, 3.0, vertexIndex == 1u)
  );

  var out : VSOutput;
  out.position = vec4<f32>(pos, 0.0, 1.0);
  out.uv = pos * 0.5 + vec2<f32>(0.5);
  out.uv.y = 1.0 - out.uv.y; // Flip Y for texture coordinates
  return out;
}
`

const BASE = /* wgsl */ `
struct Uniforms {
  offsetWeights : array<vec4<f32>, 9>,
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

fn glowCut(uv: vec2<f32>) -> vec4<f32> {
  let color = textureSample(texture1, texture1Sampler, uv).rgb;
  let luminance = max(max(color.r, color.g), color.b);

  let knee = params.threshold * 0.5;
  let soft = clamp((luminance - params.threshold + knee) / (2.0 * knee), 0.0, 1.0);
  let contribution = max(luminance - params.threshold, 0.0) + soft * soft * knee;

  return vec4<f32>(color * contribution / max(luminance, 1e-4), 1.0);
}

fn hBlur(uv: vec2<f32>) -> vec4<f32> {
  var color = vec4<f32>(0.0);
  for (var i: i32 = 0; i < 9; i = i + 1) {
    let offset = params.offsetWeights[i];
    color += textureSample(texture1, texture1Sampler, uv + vec2<f32>(offset.x, 0.0)) * offset.z;
  }
  return color;
}

fn vBlur(uv: vec2<f32>) -> vec4<f32> {
  var color = vec4<f32>(0.0);
  for (var i: i32 = 0; i < 9; i = i + 1) {
    let offset = params.offsetWeights[i];
    color += textureSample(texture1, texture1Sampler, uv + vec2<f32>(0.0, offset.y)) * offset.w;
  }
  return color;
}

fn combine(uv: vec2<f32>) -> vec4<f32> {
  let base = textureSample(texture1, texture1Sampler, uv).rgb;
  let bloom = textureSample(texture2, texture2Sampler, uv).rgb;
  return vec4<f32>(base + params.multiplier * bloom, 1.0);
}
`

export const BLOOM_WGSL_GLOW = /* wgsl */ `
${VERTEX}
${BASE}

@fragment
fn fs(in: VSOutput) -> @location(0) vec4<f32> {
  return glowCut(in.uv);
}
`

export const BLOOM_WGSL_HBLUR = /* wgsl */ `
${VERTEX}
${BASE}

@fragment
fn fs(in: VSOutput) -> @location(0) vec4<f32> {
  return hBlur(in.uv);
}
`

export const BLOOM_WGSL_VBLUR = /* wgsl */ `
${VERTEX}
${BASE}

@fragment
fn fs(in: VSOutput) -> @location(0) vec4<f32> {
  return vBlur(in.uv);
}
`

export const BLOOM_WGSL_COMBINE = /* wgsl */ `
${VERTEX}
${BASE}

@fragment
fn fs(in: VSOutput) -> @location(0) vec4<f32> {
  return combine(in.uv);
}
`
