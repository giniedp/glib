export const PIXELATE_WGSL = /* wgsl */ `
struct Uniforms {
	texel: vec2<f32>,
  size      : f32,
  aspect    : f32,
  dither    : f32,
  corner    : f32,
  gap       : f32,
};

@group(0) @binding(0) var<uniform> params: Uniforms;
@group(0) @binding(1) var textureSampler: sampler;
@group(0) @binding(2) var texture: texture_2d<f32>;

struct VSOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) uv : vec2<f32>,
};

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VSOutput {
  var pos = vec2<f32>(
    select(-1.0, 3.0, vertexIndex == 2u),
    select(-1.0, 3.0, vertexIndex == 1u)
  );

  var out : VSOutput;
  out.position = vec4<f32>(pos, 0.0, 1.0);
  out.uv = pos * 0.5 + vec2<f32>(0.5);
  return out;
}


// --- hash ---
fn hash(p : vec2<f32>) -> f32 {
  return fract(sin(dot(p, vec2<f32>(127.1, 311.7))) * 43758.5453123);
}

// --- grid ---
fn computeGrid() -> vec2<f32> {
  let size = vec2<f32>(params.size * params.aspect, params.size);
  return size * params.texel;
}

// --- sample ---
fn samplePixel(uv : vec2<f32>, grid : vec2<f32>) -> vec3<f32> {
  let snapped = floor(uv / grid) * grid;
  let center = snapped + grid * 0.5;
  return textureSample(texture, textureSampler, center).rgb;
}

// --- rounded box mask ---
fn roundedBoxMask(uv : vec2<f32>, grid : vec2<f32>) -> f32 {
  let cellUV = fract(uv / grid);
  var p = cellUV - vec2<f32>(0.5);

  let g = clamp(params.gap, 0.0, 0.49);
  let scale = 1.0 - g * 2.0;
  p = p / scale;

  p = p * 2.0;

  let r = clamp(params.corner * 0.5, 0.0, 0.5);
  let q = abs(p) - vec2<f32>(1.0 - r);

  let dist = length(max(q, vec2<f32>(0.0))) - r;

  let edge = 0.02;

  return 1.0 - smoothstep(0.0, edge, dist);
}

// --- dithering ---
fn applyDither(uv : vec2<f32>, color : vec3<f32>) -> vec3<f32> {
  if (params.dither > 0.0) {
    let n = hash(uv);
    return color + (n - 0.5) * params.dither;
  }
  return color;
}

@fragment
fn fs_main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  let grid = computeGrid();
  var color = samplePixel(uv, grid);
  let mask = roundedBoxMask(uv, grid);
  color = color * mask;
  color = applyDither(uv, color);
  return vec4<f32>(color, 1.0);
}
`
