export const VIGNETTE_WGSL = /* wgsl */ `
struct Uniforms {
	centerX: f32,
  centerY: f32,
  roundness: f32,
  stretch: f32,
  weight: f32,
  color: vec3<f32>,
};

@group(0) @binding(0) var<uniform> params: Uniforms;
@group(0) @binding(1) var textureSampler: sampler;
@group(0) @binding(2) var texture: texture_2d<f32>;

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

@fragment
fn fs(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
	// Center and stretch
	let centered = (uv - vec2<f32>(params.centerX, params.centerY)) * vec2<f32>(1.0, params.stretch);
	// Distance from center, shaped by roundness
	let dist = pow(dot(centered, centered), params.roundness);
	// Vignette factor: 1.0 at center, decreases toward corners
	let vignette = clamp(1.0 - dist * params.weight, 0.0, 1.0);
	// Blend vignette color with sampled color
	let base = textureSample(texture, textureSampler, uv).rgb;
	let color = mix(params.color, base, vignette);

	return vec4<f32>(color, 1.0);
}
`
