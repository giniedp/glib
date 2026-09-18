const BASE = /* glsl */ `
  #version 300 es
  precision highp float;
  precision highp int;

  float getLuminance(vec3 c) {
    return dot(c, vec3(0.2126f, 0.7152f, 0.0722f));
  }

  vec4 downsampleBilinear2x2(sampler2D tex, vec2 uv) {
    // relies on the sampler already being linear-filtered;
    return texture(tex, uv);
  }

  vec4 downsampleBilinear4x4(sampler2D tex, vec2 uv, vec2 texelSize) {
    vec4 sum = vec4(0.0);
    sum += texture(tex, uv + vec2(-1.0,-1.0) * texelSize);
    sum += texture(tex, uv + vec2( 1.0,-1.0) * texelSize);
    sum += texture(tex, uv + vec2(-1.0, 1.0) * texelSize);
    sum += texture(tex, uv + vec2( 1.0, 1.0) * texelSize);
    return sum * 0.25;
  }

  vec4 downsampleKawase(sampler2D tex, vec2 uv, vec2 texelSize) {
    vec4 sum = vec4(0.0);
    sum += texture(tex, uv) * 4.0;
    sum += texture(tex, uv + vec2(-1.0,-1.0) * texelSize);
    sum += texture(tex, uv + vec2( 1.0,-1.0) * texelSize);
    sum += texture(tex, uv + vec2(-1.0, 1.0) * texelSize);
    sum += texture(tex, uv + vec2( 1.0, 1.0) * texelSize);
    return sum * 0.125;
  }

  // custom 13-tap downsample kernel (36 texel lookups w/ bilinear filtering),
  // developed at Sledgehammer Games, presented by Jorge Jimenez at SIGGRAPH 2014,
  // "Next Generation Post Processing in Call of Duty: Advanced Warfare"
  // https://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare/
  vec4 downsampleJimenez13Tap(sampler2D tex, vec2 uv, vec2 texelSize) {

    vec4 a = texture(tex, uv + vec2(-1.0,-1.0) * texelSize);
    vec4 b = texture(tex, uv + vec2( 0.0,-1.0) * texelSize);
    vec4 c = texture(tex, uv + vec2( 1.0,-1.0) * texelSize);

    vec4 d = texture(tex, uv + vec2(-0.5,-0.5) * texelSize);
    vec4 e = texture(tex, uv + vec2( 0.5,-0.5) * texelSize);

    vec4 f = texture(tex, uv + vec2(-1.0, 0.0) * texelSize);
    vec4 g = texture(tex, uv);
    vec4 h = texture(tex, uv + vec2( 1.0, 0.0) * texelSize);

    vec4 i = texture(tex, uv + vec2(-0.5, 0.5) * texelSize);
    vec4 j = texture(tex, uv + vec2( 0.5, 0.5) * texelSize);

    vec4 k = texture(tex, uv + vec2(-1.0, 1.0) * texelSize);
    vec4 l = texture(tex, uv + vec2( 0.0, 1.0) * texelSize);
    vec4 m = texture(tex, uv + vec2( 1.0, 1.0) * texelSize);

    vec4 center      = (d + e + i + j) * 0.5;
    vec4 topLeft     = (a + b + f + g) * 0.125;
    vec4 topRight    = (b + c + g + h) * 0.125;
    vec4 bottomLeft  = (f + g + k + l) * 0.125;
    vec4 bottomRight = (g + h + l + m) * 0.125;

    return center * 0.5 + (topLeft + topRight + bottomLeft + bottomRight) * 0.125;
  }

  float karisWeight(vec4 c) {
    return (1.0 / (1.0 + getLuminance(c.rgb)));
  }

  // Anti-firefly weighted average, credited to Brian Karis (Epic/UE4),
  // as referenced in Jimenez's SIGGRAPH 2014 talk for firefly suppression
  // on the first HDR downsample step.
  vec4 karisAverage4(vec4 c1, vec4 c2, vec4 c3, vec4 c4) {
    float w1 = karisWeight(c1);
    float w2 = karisWeight(c2);
    float w3 = karisWeight(c3);
    float w4 = karisWeight(c4);
    float wSum = w1 + w2 + w3 + w4;
    return (c1 * w1 + c2 * w2 + c3 * w3 + c4 * w4) / wSum;
  }

  vec4 karisAverage5(vec4 c1, vec4 c2, vec4 c3, vec4 c4, vec4 c5) {
    float w1 = karisWeight(c1);
    float w2 = karisWeight(c2);
    float w3 = karisWeight(c3);
    float w4 = karisWeight(c4);
    float w5 = karisWeight(c5);
    float wSum = w1 + w2 + w3 + w4 + w5;
    return (c1 * w1 + c2 * w2 + c3 * w3 + c4 * w4 + c5 * w5) / wSum;
  }

  vec4 downsampleJimenez13TapKaris(sampler2D tex, vec2 uv, vec2 texelSize) {
    vec4 a = texture(tex, uv + vec2(-1.0,-1.0) * texelSize);
    vec4 b = texture(tex, uv + vec2( 0.0,-1.0) * texelSize);
    vec4 c = texture(tex, uv + vec2( 1.0,-1.0) * texelSize);
    vec4 d = texture(tex, uv + vec2(-0.5,-0.5) * texelSize);
    vec4 e = texture(tex, uv + vec2( 0.5,-0.5) * texelSize);
    vec4 f = texture(tex, uv + vec2(-1.0, 0.0) * texelSize);
    vec4 g = texture(tex, uv);
    vec4 h = texture(tex, uv + vec2( 1.0, 0.0) * texelSize);
    vec4 i = texture(tex, uv + vec2(-0.5, 0.5) * texelSize);
    vec4 j = texture(tex, uv + vec2( 0.5, 0.5) * texelSize);
    vec4 k = texture(tex, uv + vec2(-1.0, 1.0) * texelSize);
    vec4 l = texture(tex, uv + vec2( 0.0, 1.0) * texelSize);
    vec4 m = texture(tex, uv + vec2( 1.0, 1.0) * texelSize);

    // vec4 center      = karisAverage4(d, e, i, j);
    // vec4 topLeft     = karisAverage4(a, b, f, g);
    // vec4 topRight    = karisAverage4(b, c, g, h);
    // vec4 bottomLeft  = karisAverage4(f, g, k, l);
    // vec4 bottomRight = karisAverage4(g, h, l, m);

    // return center * 0.5 + (topLeft + topRight + bottomLeft + bottomRight) * 0.125;

    vec4 center      = (d + e + i + j) * 0.5;
    vec4 topLeft     = (a + b + f + g) * 0.125;
    vec4 topRight    = (b + c + g + h) * 0.125;
    vec4 bottomLeft  = (f + g + k + l) * 0.125;
    vec4 bottomRight = (g + h + l + m) * 0.125;

    center *= karisWeight(center);
    topLeft *= karisWeight(topLeft);
    topRight *= karisWeight(topRight);
    bottomLeft *= karisWeight(bottomLeft);
    bottomRight *= karisWeight(bottomRight);

    return center * 0.5 + (topLeft + topRight + bottomLeft + bottomRight) * 0.125;
  }
`

export const DOWNSAMPLE_GLSL_FS = /* glsl */ `
  ${BASE}

  const int DOWNSAMPLE_BILINEAR_2X2        = 0;
  const int DOWNSAMPLE_BILINEAR_4X4        = 1;
  const int DOWNSAMPLE_KAWASE              = 2;
  const int DOWNSAMPLE_JIMENEZ_13TAP       = 3;
  const int DOWNSAMPLE_JIMENEZ_13TAP_KARIS = 4;

  in vec2 uv;
  out vec4 fragColor;

  // @block params
  layout(std140) uniform Uniforms {
    int   operatorId;
  } params;

  // @alias colorMap
  uniform sampler2D colorMap;

  vec4 downsample() {
    vec2 texelSize = 1.0 / vec2(textureSize(colorMap, 0));
    switch (params.operatorId) {
      case DOWNSAMPLE_BILINEAR_4X4:
        return downsampleBilinear4x4(colorMap, uv, texelSize);
      case DOWNSAMPLE_KAWASE:
        return downsampleKawase(colorMap, uv, texelSize);
      case DOWNSAMPLE_JIMENEZ_13TAP:
        return downsampleJimenez13Tap(colorMap, uv, texelSize);
      case DOWNSAMPLE_JIMENEZ_13TAP_KARIS:
        return downsampleJimenez13TapKaris(colorMap, uv, texelSize);
      default:
        return downsampleBilinear2x2(colorMap, uv);
    }
  }

  void main() {
    vec4 result = downsample();
    fragColor = vec4(result.rgb, clamp(result.a, 0.0, 1.0));
  }
`
