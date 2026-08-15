const BLOOM_FRAGMENT_BASE = /* glsl */ `
  #version 300 es
  precision highp float;
  precision highp int;

  in vec2 uv;
  out vec4 fragColor;

  // @block params
  layout(std140) uniform Uniforms {
    vec4 offsetWeights[9];
  } params;

  // @alias colorMap
  uniform sampler2D colorMap;

  vec4 hBlur(vec2 uv) {
    vec4 color = vec4(0);
    for( int i = 0; i < 9; i++ ) {
      color += texture(colorMap, uv + vec2(params.offsetWeights[i].x, 0.0)) * params.offsetWeights[i].z;
    }
    return color;
  }

  vec4 vBlur(vec2 uv) {
    vec4 color = vec4(0);
    for( int i = 0; i < 9; i++ ) {
      color += texture(colorMap, uv + vec2(0.0, params.offsetWeights[i].y)) * params.offsetWeights[i].w;
    }
    return color;
  }
`

export const BLOOM_GLSL_HBLUR_FRAGMENT = /* glsl */ `
  ${BLOOM_FRAGMENT_BASE}
  void main() {
    fragColor = hBlur(uv);
  }
`

export const BLOOM_GLSL_VBLUR_FRAGMENT = /* glsl */ `
  ${BLOOM_FRAGMENT_BASE}
  void main() {
    fragColor = vBlur(uv);
  }
`
