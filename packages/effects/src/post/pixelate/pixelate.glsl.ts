export const PIXELATE_GLSL_VERTEX: string = /* glsl */ `
  #version 300 es
  precision highp float;
  precision highp int;

  out vec2 uv;

  void main(void) {
    vec2 pos = vec2(
      (gl_VertexID == 2) ? 3.0 : -1.0,
      (gl_VertexID == 1) ? 3.0 : -1.0
    );

    gl_Position = vec4(pos, 0.0, 1.0);
    uv = pos * 0.5 + 0.5;
    //uv.y = 1.0 - uv.y; // Flip Y for WebGL
  }
`

const PIXELATE_FRAGMENT_BASE = /* glsl */ `
  #version 300 es
  precision highp float;
  precision highp int;

  in vec2 uv;
  out vec4 fragColor;

  // @alias params
  uniform Uniforms {
    vec2 texelSize;
    float size;
    float aspect;
    float dither;
    float corner;
    float gap;
  } params;

  // @alias texture
  uniform sampler2D texture1Sampler;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  vec2 computeGrid() {
    vec2 size = vec2(params.size * params.aspect, params.size);
    return size * params.texelSize;
  }

  vec3 samplePixel(vec2 uv, vec2 grid) {
    vec2 snapped = floor(uv / grid) * grid;
    vec2 center = snapped + grid * 0.5;
    return texture(texture1Sampler, center).rgb;
  }

  float shapeMask(vec2 uv, vec2 grid) {
    vec2 local = fract(uv / grid) - 0.5;
    local.x *= params.aspect;

    float squareDist = max(abs(local.x), abs(local.y));
    float circleDist = length(local);
    float dist = mix(squareDist, circleDist, params.corner);

    float radius = 0.5;
    float edge = 0.02;

    return 1.0 - smoothstep(radius, radius + edge, dist);
  }

  float roundedBoxMask(vec2 uv, vec2 grid) {
    vec2 cellUV = fract(uv / grid);

    vec2 p = cellUV - 0.5;

    // apply gap (shrink usable area)
    float g = clamp(params.gap, 0.0, 0.49); // avoid collapse
    float scale = 1.0 - g * 2.0;
    p /= scale; // expand coordinates so shape shrinks

    p *= 2.0; // scale to [-1,1] box

    float r = clamp(params.corner * 0.5, 0.0, 0.5);
    vec2 q = abs(p) - (1.0 - r);
    float dist = length(max(q, 0.0)) - r;
    float edge = 0.02;
    return 1.0 - smoothstep(0.0, edge, dist);
  }

  vec3 applyDither(vec2 uv, vec3 color) {
    if (params.dither > 0.0) {
      float n = hash(uv);
      return color + (n - 0.5) * params.dither;
    }
    return color;
  }
`

export const PIXELATE_GLSL_FRAGMENT: string = /* glsl */ `
  ${PIXELATE_FRAGMENT_BASE}

  void main() {
    vec2 grid = computeGrid();
    vec3 color = samplePixel(uv, grid);
    float mask = roundedBoxMask(uv, grid);
    color *= mask;
    color = applyDither(uv, color);
    fragColor = vec4(color, 1.0);
  }
`
