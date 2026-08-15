export const TONEMAP_GLSL_FS = /* glsl */ `
  #version 300 es
  precision highp float;
  precision highp int;

  in vec2 uv;
  out vec4 fragColor;

  // @block params
  layout(std140) uniform Uniforms {
    float exposure;
    float whitePoint;
    int autoExposure;
    int operatorId;
    int srgb;
  } params;

  // @alias texture1
  uniform sampler2D texture1Sampler;
  // @alias texture2
  uniform sampler2D texture2Sampler;

  const vec3 dotLum = vec3(0.2126, 0.7152, 0.0722);

  const int TONEMAP_PASSTHROUGH       = 0;
  const int TONEMAP_REINHARD          = 1;
  const int TONEMAP_REINHARD_EXTENDED = 2;
  const int TONEMAP_REINHARD_JODIE    = 3;
  const int TONEMAP_UNCHARTED2        = 4;
  const int TONEMAP_ACES_NARKOWICZ    = 5;
  const int TONEMAP_ACES_HILL         = 6;
  const int TONEMAP_PBR_NEUTRAL       = 7;
  const int TONEMAP_UCHIMURA          = 8;

  //
  // plain Reinhard
  //
  vec3 tonemapReinhard(vec3 color) {
    return color / (1.0 + color);
  }

  //
  // Reinhard Extended
  //
  vec3 tonemapReinhardExtended(vec3 c, float white) {
    float l = dot(c, dotLum);
    if (l <= 0.0) {
      return vec3(0.0);
    }
    float Ld = l * (1.0 + l / (white * white)) / (1.0 + l);
    return c * (Ld / l);
  }

  // Reinhard-Jodie, reduces desaturation in highlights
  // https://64.github.io/tonemapping/#reinhard-jodie
  vec3 tonemapReinhardJodie(vec3 c) {
    float l  = dot(c, dotLum);
    vec3 tc  = c / (1.0 + c);
    return mix(c / (1.0 + l), tc, tc);
  }

  // Uncharted 2 / Hable filmic
  // https://64.github.io/tonemapping/#uncharted-2
  vec3 uncharted2Partial(vec3 x) {
    const float A = 0.15;
    const float B = 0.50;
    const float C = 0.10;
    const float D = 0.20;
    const float E = 0.02;
    const float F = 0.30;
    return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
  }

  vec3 tonemapUncharted2(vec3 c, float white) {
    vec3 curr = uncharted2Partial(c);
    vec3 whiteScale = 1.0 / uncharted2Partial(vec3(white));
    return curr * whiteScale;
  }

  // ACES fitted (Narkowicz), fast approximation
  vec3 tonemapAcesNarkowicz(vec3 color) {
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return clamp((color * (a * color + b)) / (color * (c * color + d) + e), 0.0, 1.0);
  }

  // ACES fitted (Stephen Hill), matrix + RRT/ODT fit
  vec3 rttAndOdtFit(vec3 v) {
    vec3 a = v * (v + 0.0245786) - 0.000090537;
    vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
    return a / b;
  }
  vec3 tonemapAcesHill(vec3 c) {
    const mat3 acesInput = mat3(
      0.59719, 0.07600, 0.02840,
      0.35458, 0.90834, 0.13383,
      0.04823, 0.01566, 0.83777
    );
    const mat3 acesOutput = mat3(
       1.60475, -0.10208, -0.00327,
      -0.53108,  1.10813, -0.07276,
      -0.07367, -0.00605,  1.07602
    );
    vec3 v = acesInput * c;
    v = rttAndOdtFit(v);
    return clamp(acesOutput * v, 0.0, 1.0);
  }

  // Khronos PBR Neutral
  // https://modelviewer.dev/examples/tone-mapping
  vec3 tonemapPbrNeutral(vec3 color) {
    const float startCompression = 0.8 - 0.04;
    const float desaturation = 0.15;
    float x = min(color.r, min(color.g, color.b));
    float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
    color -= offset;
    float peak = max(color.r, max(color.g, color.b));
    if (peak < startCompression) {
      return color;
    }
    float d = 1.0 - startCompression;
    float newPeak = 1.0 - d * d / (peak + d - startCompression);
    color *= newPeak / peak;
    float g = 1.0 - 1.0 / (desaturation * (peak - newPeak) + 1.0);
    return mix(color, vec3(newPeak), g);
  }

  // Uchimura (Gran Turismo), fixed artistic constants + exposed white point
  float uchimuraCurve(float x, float P, float a, float m, float l, float c, float b) {
    float l0 = ((P - m) * l) / a;
    float L0 = m - m / a;
    float L1 = m + (1.0 - m) / a;
    float S0 = m + l0;
    float S1 = m + a * l0;
    float C2 = (a * P) / (P - S1);
    float CP = -C2 / P;

    float w0 = 1.0 - smoothstep(0.0, m, x);
    float w2 = step(m + l0, x);
    float w1 = 1.0 - w0 - w2;

    float T = m * pow(x / m, c) + b;
    float S = P - (P - S1) * exp(CP * (x - S0));
    float L = m + a * (x - m);

    return T * w0 + L * w1 + S * w2;
  }
  vec3 tonemapUchimura(vec3 color, float white) {
    const float a = 1.0;
    const float m = 0.22;
    const float l = 0.4;
    const float c = 1.33;
    const float b = 0.0;
    return vec3(
      uchimuraCurve(color.r, white, a, m, l, c, b),
      uchimuraCurve(color.g, white, a, m, l, c, b),
      uchimuraCurve(color.b, white, a, m, l, c, b)
    );
  }

  vec3 tonemap(vec3 color, float whitePoint, int op) {
    switch (op) {
      case TONEMAP_REINHARD:
        return tonemapReinhard(color);
      case TONEMAP_REINHARD_EXTENDED:
        return tonemapReinhardExtended(color, whitePoint);
      case TONEMAP_REINHARD_JODIE:
        return tonemapReinhardJodie(color);
      case TONEMAP_UNCHARTED2:
        return tonemapUncharted2(color, whitePoint);
      case TONEMAP_ACES_NARKOWICZ:
        return tonemapAcesNarkowicz(color);
      case TONEMAP_ACES_HILL:
        return tonemapAcesHill(color);
      case TONEMAP_PBR_NEUTRAL:
        return tonemapPbrNeutral(color);
      case TONEMAP_UCHIMURA:
        return tonemapUchimura(color, whitePoint);
      default:
        return clamp(color, 0.0, 1.0);
    }
  }

  vec3 linearToSrgb(vec3 c) {
    vec3 cutoff = vec3(0.0031308);
    return mix(12.92 * c, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(cutoff, c));
  }

  void main() {
    vec3 color = texture(texture1Sampler, uv).rgb;
    float exposure = params.exposure;
    if (params.autoExposure != 0) {
      float global = texture(texture2Sampler, vec2(0.5,0.5)).r;
      exposure = exposure / max(global, 1e-6);
    }
    vec3 mapped = tonemap(color * exposure, params.whitePoint, params.operatorId);
    if (params.srgb != 0) {
      mapped = linearToSrgb(mapped);
    }
    fragColor = vec4(mapped, 1.0);
  }
`
