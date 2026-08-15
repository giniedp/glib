const BASE = /* glsl */ `
  #version 300 es
  precision highp float;
  precision highp int;

  float getMaxBrightness(vec3 c) {
    return max(max(c.r, c.g), c.b);
  }

  vec3 downsampleBilinear2x2(sampler2D tex, vec2 uv) {
    // relies on the sampler already being linear-filtered;
    return texture(tex, uv).rgb;
  }

  vec3 downsampleBilinear4x4(sampler2D tex, vec2 uv, vec2 texelSize) {
    vec3 sum = vec3(0.0);
    sum += texture(tex, uv + vec2(-1.0,-1.0) * texelSize).rgb;
    sum += texture(tex, uv + vec2( 1.0,-1.0) * texelSize).rgb;
    sum += texture(tex, uv + vec2(-1.0, 1.0) * texelSize).rgb;
    sum += texture(tex, uv + vec2( 1.0, 1.0) * texelSize).rgb;
    return sum * 0.25;
  }

  vec3 downsampleKawase(sampler2D tex, vec2 uv, vec2 texelSize) {
    vec3 sum = vec3(0.0);
    sum += texture(tex, uv).rgb * 4.0;
    sum += texture(tex, uv + vec2(-1.0,-1.0) * texelSize).rgb;
    sum += texture(tex, uv + vec2( 1.0,-1.0) * texelSize).rgb;
    sum += texture(tex, uv + vec2(-1.0, 1.0) * texelSize).rgb;
    sum += texture(tex, uv + vec2( 1.0, 1.0) * texelSize).rgb;
    return sum * 0.125;
  }

  // custom 13-tap downsample kernel (36 texel lookups w/ bilinear filtering),
  // developed at Sledgehammer Games, presented by Jorge Jimenez at SIGGRAPH 2014,
  // "Next Generation Post Processing in Call of Duty: Advanced Warfare"
  // https://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare/
  vec3 downsampleJimenez13Tap(sampler2D tex, vec2 uv, vec2 texelSize) {

    vec3 a = texture(tex, uv + vec2(-1.0,-1.0) * texelSize).rgb;
    vec3 b = texture(tex, uv + vec2( 0.0,-1.0) * texelSize).rgb;
    vec3 c = texture(tex, uv + vec2( 1.0,-1.0) * texelSize).rgb;

    vec3 d = texture(tex, uv + vec2(-0.5,-0.5) * texelSize).rgb;
    vec3 e = texture(tex, uv + vec2( 0.5,-0.5) * texelSize).rgb;

    vec3 f = texture(tex, uv + vec2(-1.0, 0.0) * texelSize).rgb;
    vec3 g = texture(tex, uv).rgb;
    vec3 h = texture(tex, uv + vec2( 1.0, 0.0) * texelSize).rgb;

    vec3 i = texture(tex, uv + vec2(-0.5, 0.5) * texelSize).rgb;
    vec3 j = texture(tex, uv + vec2( 0.5, 0.5) * texelSize).rgb;

    vec3 k = texture(tex, uv + vec2(-1.0, 1.0) * texelSize).rgb;
    vec3 l = texture(tex, uv + vec2( 0.0, 1.0) * texelSize).rgb;
    vec3 m = texture(tex, uv + vec2( 1.0, 1.0) * texelSize).rgb;

    vec3 center = (d + e + i + j) * 0.5;
    vec3 topLeft = (a + b + f + g) * 0.125;
    vec3 topRight = (b + c + g + h) * 0.125;
    vec3 bottomLeft = (f + g + k + l) * 0.125;
    vec3 bottomRight = (g + h + l + m) * 0.125;

    return center * 0.5 + (topLeft + topRight + bottomLeft + bottomRight) * 0.125;
  }

  // Anti-firefly weighted average, credited to Brian Karis (Epic/UE4),
  // as referenced in Jimenez's SIGGRAPH 2014 talk for firefly suppression
  // on the first HDR downsample step.
  vec3 karisAverage(vec3 c1, vec3 c2, vec3 c3, vec3 c4) {
    float w1 = 1.0 / (1.0 + getMaxBrightness(c1));
    float w2 = 1.0 / (1.0 + getMaxBrightness(c2));
    float w3 = 1.0 / (1.0 + getMaxBrightness(c3));
    float w4 = 1.0 / (1.0 + getMaxBrightness(c4));
    float wSum = w1 + w2 + w3 + w4;
    return (c1 * w1 + c2 * w2 + c3 * w3 + c4 * w4) / max(wSum, 1e-4);
  }

  vec3 downsampleJimenez13TapKaris(sampler2D tex, vec2 uv, vec2 texelSize) {
    vec3 a = texture(tex, uv + vec2(-1.0,-1.0) * texelSize).rgb;
    vec3 b = texture(tex, uv + vec2( 0.0,-1.0) * texelSize).rgb;
    vec3 c = texture(tex, uv + vec2( 1.0,-1.0) * texelSize).rgb;
    vec3 d = texture(tex, uv + vec2(-0.5,-0.5) * texelSize).rgb;
    vec3 e = texture(tex, uv + vec2( 0.5,-0.5) * texelSize).rgb;
    vec3 f = texture(tex, uv + vec2(-1.0, 0.0) * texelSize).rgb;
    vec3 g = texture(tex, uv).rgb;
    vec3 h = texture(tex, uv + vec2( 1.0, 0.0) * texelSize).rgb;
    vec3 i = texture(tex, uv + vec2(-0.5, 0.5) * texelSize).rgb;
    vec3 j = texture(tex, uv + vec2( 0.5, 0.5) * texelSize).rgb;
    vec3 k = texture(tex, uv + vec2(-1.0, 1.0) * texelSize).rgb;
    vec3 l = texture(tex, uv + vec2( 0.0, 1.0) * texelSize).rgb;
    vec3 m = texture(tex, uv + vec2( 1.0, 1.0) * texelSize).rgb;

    vec3 center      = karisAverage(d, e, i, j);
    vec3 topLeft     = karisAverage(a, b, f, g);
    vec3 topRight    = karisAverage(b, c, g, h);
    vec3 bottomLeft  = karisAverage(f, g, k, l);
    vec3 bottomRight = karisAverage(g, h, l, m);

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

  vec3 downsample() {
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
    fragColor = vec4(downsample(), 1.0);
  }
`
