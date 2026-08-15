import { FULLSCREEN_WGSL_VS } from '../common.wgsl'

export const TONEMAP_WGSL = /* wgsl */ `
  ${FULLSCREEN_WGSL_VS}

  struct Uniforms {
    exposure : f32,
    whitePoint : f32,
    autoExposure : i32,
    operatorId : i32,
    srgb : i32,
  };

  @group(0) @binding(0)
  var<uniform> params : Uniforms;

  @group(0) @binding(1)
  var texture1 : texture_2d<f32>;

  @group(0) @binding(2)
  var texture1Sampler : sampler;

  @group(0) @binding(3)
  var texture2 : texture_2d<f32>;

  @group(0) @binding(4)
  var texture2Sampler : sampler;

  const dotLum : vec3f = vec3f(0.2126, 0.7152, 0.0722);

  fn extractLuminance(tex: texture_2d<f32>, samp: sampler, uv: vec2f, texel: vec2f) -> vec4f {
    var average = 0.0;
    var minimum = 1.0;
    var maximum = -1e20;
    var color = vec3f(0.0);
    var lum = 0.0;

    // get color and calculate luminance
    color   = textureSample(tex, samp, uv).rgb;
    lum     = dot(color, dotLum);
    average = average + lum;
    minimum = min(minimum, lum);
    maximum = max(maximum, lum);

    color   = textureSample(tex, samp, uv + texel).rgb;
    lum     = dot(color, dotLum);
    average = average + lum;
    minimum = min(minimum, lum);
    maximum = max(maximum, lum);

    color   = textureSample(tex, samp, uv + vec2f(texel.x, 0.0)).rgb;
    lum     = dot(color, dotLum);
    average = average + lum;
    minimum = min(minimum, lum);
    maximum = max(maximum, lum);

    color   = textureSample(tex, samp, uv + vec2f(0.0, texel.y)).rgb;
    lum     = dot(color, dotLum);
    average = average + lum;
    minimum = min(minimum, lum);
    maximum = max(maximum, lum);

    average *= 0.25;
    return vec4f(average, maximum, minimum, 1.0);
  }

  fn downsample(tex: texture_2d<f32>, samp: sampler, uv: vec2f, texel: vec2f) -> vec4f {
    var luminance = vec3f(0.0);
    var data = vec3f(0.0);

    data = textureSample(tex, samp, uv).rgb;
    luminance.r = luminance.r + data.r;
    luminance.g = max(luminance.g, data.g);
    luminance.b = min(luminance.b, data.b);

    data = textureSample(tex, samp, uv + texel).rgb;
    luminance.r = luminance.r + data.r;
    luminance.g = max(luminance.g, data.g);
    luminance.b = min(luminance.b, data.b);

    data = textureSample(tex, samp, uv + vec2f(texel.x, 0.0)).rgb;
    luminance.r = luminance.r + data.r;
    luminance.g = max(luminance.g, data.g);
    luminance.b = min(luminance.b, data.b);

    data = textureSample(tex, samp, uv + vec2f(0.0, texel.y)).rgb;
    luminance.r = luminance.r + data.r;
    luminance.g = max(luminance.g, data.g);
    luminance.b = min(luminance.b, data.b);

    luminance.r *= 0.25;
    return vec4f(luminance, 1.0);
  }

  fn adaptLuminance(tex1: texture_2d<f32>, samp1: sampler, tex2: texture_2d<f32>, samp2: sampler, uv: vec2f, texel: vec2f, speed: f32) -> vec4f {
    var luminance = vec3f(0.0);

    var data = textureSample(tex1, samp1, uv);
    luminance.r += data.r;
    luminance.g = max(luminance.g, data.g);
    luminance.b = min(luminance.b, data.b);

    data = textureSample(tex1, samp1, uv + texel);
    luminance.r += data.r;
    luminance.g = max(luminance.g, data.g);
    luminance.b = min(luminance.b, data.b);

    data = textureSample(tex1, samp1, uv + vec2f(texel.x, 0.0));
    luminance.r += data.r;
    luminance.g = max(luminance.g, data.g);
    luminance.b = min(luminance.b, data.b);

    data = textureSample(tex1, samp1, uv + vec2f(0.0, texel.y));
    luminance.r += data.r;
    luminance.g = max(luminance.g, data.g);
    luminance.b = min(luminance.b, data.b);

    luminance.r *= 0.25;

    let adaptedLum = textureSample(tex2, samp2, vec2f(0.5, 0.5)).rgb;
    luminance = adaptedLum + (luminance - adaptedLum) * clamp(speed, 0.0, 1.0);
    return vec4f(luminance, 1.0);
  }

  const TONEMAP_OFF               : i32 = 0;
  const TONEMAP_REINHARD          : i32 = 1;
  const TONEMAP_REINHARD_EXTENDED : i32 = 2;
  const TONEMAP_REINHARD_JODIE    : i32 = 3;
  const TONEMAP_UNCHARTED2        : i32 = 4;
  const TONEMAP_ACES_NARKOWICZ    : i32 = 5;
  const TONEMAP_ACES_HILL         : i32 = 6;
  const TONEMAP_PBR_NEUTRAL       : i32 = 7;
  const TONEMAP_UCHIMURA          : i32 = 8;

  //
  // plain Reinhard
  //
  fn tonemapReinhard(color: vec3f) -> vec3f {
    return color / (1.0 + color);
  }

  //
  // Reinhard Extended
  //
  fn tonemapReinhardExtended(c: vec3f, white: f32) -> vec3f {
    let l = dot(c, dotLum);
    if (l <= 0.0) {
      return vec3f(0.0);
    }
    let Ld = l * (1.0 + l / (white * white)) / (1.0 + l);
    return c * (Ld / l);
  }

  // Reinhard-Jodie, reduces desaturation in highlights
  // https://64.github.io/tonemapping/#reinhard-jodie
  fn tonemapReinhardJodie(c: vec3f) -> vec3f {
    let l  = dot(c, dotLum);
    let tc = c / (1.0 + c);
    return mix(c / (1.0 + l), tc, tc);
  }

  // Uncharted 2 / Hable filmic
  // https://64.github.io/tonemapping/#uncharted-2
  fn uncharted2Partial(x: vec3f) -> vec3f {
    let A = 0.15;
    let B = 0.50;
    let C = 0.10;
    let D = 0.20;
    let E = 0.02;
    let F = 0.30;
    return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
  }

  fn tonemapUncharted2(c: vec3f, white: f32) -> vec3f {
    let curr = uncharted2Partial(c);
    let whiteScale = 1.0 / uncharted2Partial(vec3f(white));
    return curr * whiteScale;
  }

  // ACES fitted (Narkowicz), fast approximation
  fn tonemapAcesNarkowicz(color: vec3f) -> vec3f {
    let a = 2.51;
    let b = 0.03;
    let c = 2.43;
    let d = 0.59;
    let e = 0.14;
    return clamp((color * (a * color + b)) / (color * (c * color + d) + e), vec3f(0.0), vec3f(1.0));
  }

  // ACES fitted (Stephen Hill), matrix + RRT/ODT fit
  fn rttAndOdtFit(v: vec3f) -> vec3f {
    let a = v * (v + 0.0245786) - 0.000090537;
    let b = v * (0.983729 * v + 0.4329510) + 0.238081;
    return a / b;
  }
  fn tonemapAcesHill(c: vec3f) -> vec3f {
    let acesInput = mat3x3f(
      0.59719, 0.07600, 0.02840,
      0.35458, 0.90834, 0.13383,
      0.04823, 0.01566, 0.83777
    );
    let acesOutput = mat3x3f(
      1.60475, -0.10208, -0.00327,
      -0.53108,  1.10813, -0.07276,
      -0.07367, -0.00605,  1.07602
    );
    var v = acesInput * c;
    v = rttAndOdtFit(v);
    return clamp(acesOutput * v, vec3f(0.0), vec3f(1.0));
  }

  // Khronos PBR Neutral
  // https://modelviewer.dev/examples/tone-mapping
  fn tonemapPbrNeutral(colorIn: vec3f) -> vec3f {
    let startCompression = 0.8 - 0.04;
    let desaturation = 0.15;
    var color = colorIn;
    let x = min(color.r, min(color.g, color.b));
    let offset = select(0.04, x - 6.25 * x * x, x < 0.08);
    color -= offset;
    let peak = max(color.r, max(color.g, color.b));
    if (peak < startCompression) {
      return color;
    }
    let d = 1.0 - startCompression;
    let newPeak = 1.0 - d * d / (peak + d - startCompression);
    color *= newPeak / peak;
    let g = 1.0 - 1.0 / (desaturation * (peak - newPeak) + 1.0);
    return mix(color, vec3f(newPeak), g);
  }

  // Uchimura (Gran Turismo), fixed artistic constants + exposed white point
  fn uchimuraCurve(x: f32, P: f32, a: f32, m: f32, l: f32, c: f32, b: f32) -> f32 {
    let l0 = ((P - m) * l) / a;
    let L0 = m - m / a;
    let L1 = m + (1.0 - m) / a;
    let S0 = m + l0;
    let S1 = m + a * l0;
    let C2 = (a * P) / (P - S1);
    let CP = -C2 / P;

    let w0 = 1.0 - smoothstep(0.0, m, x);
    let w2 = step(m + l0, x);
    let w1 = 1.0 - w0 - w2;

    let T = m * pow(x / m, c) + b;
    let S = P - (P - S1) * exp(CP * (x - S0));
    let L = m + a * (x - m);

    return T * w0 + L * w1 + S * w2;
  }
  fn tonemapUchimura(color: vec3f, white: f32) -> vec3f {
    let a = 1.0;
    let m = 0.22;
    let l = 0.4;
    let c = 1.33;
    let b = 0.0;
    return vec3f(
      uchimuraCurve(color.r, white, a, m, l, c, b),
      uchimuraCurve(color.g, white, a, m, l, c, b),
      uchimuraCurve(color.b, white, a, m, l, c, b)
    );
  }

  // --- entry point ---
  fn tonemap(color: vec3f, whitePoint: f32, op: i32) -> vec3f {
    switch (op) {
      case TONEMAP_REINHARD: {
        return tonemapReinhard(color);
      }
      case TONEMAP_REINHARD_EXTENDED: {
        return tonemapReinhardExtended(color, whitePoint);
      }
      case TONEMAP_REINHARD_JODIE: {
        return tonemapReinhardJodie(color);
      }
      case TONEMAP_UNCHARTED2: {
        return tonemapUncharted2(color, whitePoint);
      }
      case TONEMAP_ACES_NARKOWICZ: {
        return tonemapAcesNarkowicz(color);
      }
      case TONEMAP_ACES_HILL: {
        return tonemapAcesHill(color);
      }
      case TONEMAP_PBR_NEUTRAL: {
        return tonemapPbrNeutral(color);
      }
      case TONEMAP_UCHIMURA: {
        return tonemapUchimura(color, whitePoint);
      }
      default: {
        return clamp(color, vec3f(0.0), vec3f(1.0));
      }
    }
  }

  fn linearToSrgb(c: vec3f) -> vec3f {
    let cutoff = vec3f(0.0031308);
    return select( 12.92 * c, 1.055 * pow(c, vec3f(1.0 / 2.4)) - 0.055, c > cutoff );
  }
  @fragment
  fn fs(in: FragmentInput) -> @location(0) vec4f {
    let color = textureSample(texture1, texture1Sampler, in.uv).rgb;
    var exposure = params.exposure;
    if (params.autoExposure != 0) {
      let global = textureSample(texture2, texture2Sampler, vec2f(0.5, 0.5)).r;
      exposure = exposure / max(global, 1e-6);
    }
    var mapped = tonemap(color * exposure, params.whitePoint, params.operatorId);
    if (params.srgb == 1) {
      mapped = linearToSrgb(mapped);
    }
    return vec4f(mapped, 1.0);
  }
`
