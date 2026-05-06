export const BLOOM_GLSL_VERTEX: string = /* glsl */ `
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
const BLOOM_FRAGMENT_BASE = /* glsl */ `
  #version 300 es
  precision highp float;
  precision highp int;

  in vec2 uv;
  out vec4 fragColor;

  // @alias params
  uniform Uniforms {
    vec4 offsetWeights[9];
    float threshold;
    float multiplier;
  } params;


  // @alias texture
  uniform sampler2D texture1Sampler;

  // @alias textureBloom
  uniform sampler2D texture2Sampler;

  vec4 glowCut(vec2 uv) {
    vec3 color = texture(texture1Sampler, uv).rgb;
    //float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    float luminance = max(max(color.r, color.g), color.b);

    float knee = params.threshold * 0.5; // or separate uniform
    float soft = clamp((luminance - params.threshold + knee) / (2.0 * knee), 0.0, 1.0);
    float contribution = max(luminance - params.threshold, 0.0) + soft * soft * knee;
    return vec4(color * contribution / max(luminance, 1e-4), 1.0);

    // if (luminance > params.threshold) {
    //   return vec4(color.rgb, 1.0);
    // }
    // return vec4(0.0, 0.0, 0.0, 1.0);
  }

  vec4 hBlur(vec2 uv) {
    vec4 color = vec4(0);
    for( int i = 0; i < 9; i++ ) {
      color += texture(texture1Sampler, uv + vec2(params.offsetWeights[i].x, 0.0)) * params.offsetWeights[i].z;
    }
    return color;
  }

  vec4 vBlur(vec2 uv) {
    vec4 color = vec4(0);
    for( int i = 0; i < 9; i++ ) {
      color += texture(texture1Sampler, uv + vec2(0.0, params.offsetWeights[i].y)) * params.offsetWeights[i].w;
    }
    return color;
  }

  vec4 combine(vec2 uv) {
    vec3 base = texture(texture1Sampler, uv).rgb;
    vec3 bloom = texture(texture2Sampler, uv).rgb;
    return vec4(base + params.multiplier * bloom, 1.0);
  }
`

export const BLOOM_GLSL_GLOW_FRAGMENT = /* glsl */ `
  ${BLOOM_FRAGMENT_BASE}
  void main() {
    fragColor = glowCut(uv);
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

export const BLOOM_GLSL_COMBINE_FRAGMENT = /* glsl */ `
  ${BLOOM_FRAGMENT_BASE}
  void main() {
    fragColor = combine(uv);
  }
`
