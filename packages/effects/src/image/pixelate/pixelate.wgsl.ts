export const PIXELATE_WGSL = /* wgsl */ `
struct Uniforms {
	texelx    : f32,
  texely    : f32,
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
  @builtin(position) position : vec4f,
  @location(0) uv : vec2f,
};

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VSOutput {
  var pos = vec2f(
    select(-1.0, 3.0, vertexIndex == 2u),
    select(-1.0, 3.0, vertexIndex == 1u)
  );

  var out : VSOutput;
  out.position = vec4f(pos, 0.0, 1.0);
  out.uv = pos * 0.5 + vec2f(0.5);
  out.uv.y = 1.0 - out.uv.y; // Flip Y for texture coordinates
  return out;
}


// --- hash ---
fn hash(p : vec2f) -> f32 {
  return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453123);
}

// --- grid ---
fn computeGrid() -> vec2f {
  let size = vec2f(params.size * params.aspect, params.size);
  return size * vec2f(params.texelx, params.texely);
}

// --- sample ---
fn samplePixel(uv : vec2f, grid : vec2f) -> vec3<f32> {
  let snapped = floor(uv / grid) * grid;
  let center = snapped + grid * 0.5;
  return textureSample(texture, textureSampler, center).rgb;
}

// --- rounded box mask ---
fn roundedBoxMask(uv : vec2f, grid : vec2f) -> f32 {
  let cellUV = fract(uv / grid);
  var p = cellUV - vec2f(0.5);

  let g = clamp(params.gap, 0.0, 0.49);
  let scale = 1.0 - g * 2.0;
  p = p / scale;

  p = p * 2.0;

  let r = clamp(params.corner, 0.0, 1.0);
  let q = abs(p) - vec2f(1.0 - r);

  let dist = length(max(q, vec2f(0.0))) - r;

  let edge = 0.02;

  return 1.0 - smoothstep(0.0, edge, dist);
}

// --- dithering ---
fn applyDither(uv : vec2f, color : vec3<f32>) -> vec3<f32> {
  if (params.dither > 0.0) {
    let n = hash(uv);
    return color + (n - 0.5) * params.dither;
  }
  return color;
}

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let grid = computeGrid();
  var color = samplePixel(uv, grid);
  let mask = roundedBoxMask(uv, grid);
  color = color * mask;
  color = applyDither(uv, color);
  return vec4f(color, 1.0);
}
`
