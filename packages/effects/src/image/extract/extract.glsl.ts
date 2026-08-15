const BASE = /* glsl */ `
  #version 300 es
  precision highp float;
  precision highp int;

  float getLuminance(vec3 c) {
    return dot(c, vec3(0.2126, 0.7152, 0.0722));
  }

  float getMaxBrightness(vec3 c) {
    return max(max(c.r, c.g), c.b);
  }

  vec2 getChroma(vec3 c) {
    // Cb, Cr only
    float y  = getLuminance(c);
    float cb = 0.5 * (c.b - y) / (1.0 - 0.0722);
    float cr = 0.5 * (c.r - y) / (1.0 - 0.2126);
    return vec2(cb, cr);
  }

  vec3 extractLogLuminance(vec3 color) {
    float lum = getLuminance(color);
    return vec3(log(max(lum, 1e-4)));
  }

  vec3 extractHighPass(vec3 color, float threshold, float knee) {
    float lum = getMaxBrightness(color);

    float soft = clamp((lum - threshold + knee) / (2.0 * knee), 0.0, 1.0);
    float contribution = max(lum - threshold, 0.0) + soft * soft * knee;

    return color * contribution / max(lum, 1e-4);
  }

  vec3 extractBandpass(vec3 color, float threshold, float range, float knee) {
    float lum = getLuminance(color);

    float thresholdLow  = threshold;
    float thresholdHigh = threshold + range;

    float lowEdge  = smoothstep(thresholdLow  - knee, thresholdLow  + knee, lum);
    float highEdge = 1.0 - smoothstep(thresholdHigh - knee, thresholdHigh + knee, lum);

    float weight = lowEdge * highEdge;
    return color * weight;
}

  vec3 extractColorKeyRGB(vec3 color, vec3 targetColor, float tolerance, float knee) {
    float dist = distance(color, targetColor);
    float weight = smoothstep(tolerance - knee, tolerance + knee, dist);
    // weight = 0 near target color (keyed out), 1 far from it (kept)
    return color * weight;
  }

  vec3 extractColorKeyChroma(vec3 color, vec3 targetColor, float tolerance, float knee) {
    vec2 keyChroma = getChroma(targetColor);
    vec2 pixChroma = getChroma(color);
    float dist = distance(pixChroma, keyChroma);
    float weight = smoothstep(tolerance - knee, tolerance + knee, dist);
    return color * weight;
  }
`

export const EXTRACT_GLSL_FS = /* glsl */ `
  ${BASE}

  const int EXTRACT_PASSTHROUGH       = 0;
  const int EXTRACT_LUMINANCE         = 1;
  const int EXTRACT_LOG_LUMINANCE     = 2;
  const int EXTRACT_MAX_BRIGHTNESS    = 3;
  const int EXTRACT_HIGH_PASS         = 4;
  const int EXTRACT_BAND_PASS         = 5;
  const int EXTRACT_COLOR_KEY_RGB     = 6;
  const int EXTRACT_COLOR_KEY_CHROMA  = 7;

  in vec2 uv;
  out vec4 fragColor;

  // @block params
  layout(std140) uniform Uniforms {
    float threshold;
    float range;
    float knee;
    int   operatorId;
    vec3  colorKey;
  } params;

  // @alias colorMap
  uniform sampler2D colorMap;

  vec3 extract(vec3 color) {
    switch (params.operatorId) {
      case EXTRACT_LUMINANCE:
        return vec3(getLuminance(color));
      case EXTRACT_LOG_LUMINANCE:
        return vec3(extractLogLuminance(color));
      case EXTRACT_MAX_BRIGHTNESS:
        return vec3(getMaxBrightness(color));
      case EXTRACT_HIGH_PASS:
        return extractHighPass(color, params.threshold, params.knee);
      case EXTRACT_BAND_PASS:
        return extractBandpass(color, params.threshold, params.range, params.knee);
      case EXTRACT_COLOR_KEY_RGB:
        return extractColorKeyRGB(color, params.colorKey, params.threshold, params.knee);
      case EXTRACT_COLOR_KEY_CHROMA:
        return extractColorKeyChroma(color, params.colorKey, params.threshold, params.knee);
      default:
        return color;
    }
  }

  void main() {
    vec3 color = texture(colorMap, uv).rgb;
    fragColor = vec4(extract(color), 1.0);
  }
`
