import { FULLSCREEN_WGSL_VS } from '../common.wgsl'

export const EXTRACT_WGSL_FS = /* wgsl */ `
  ${FULLSCREEN_WGSL_VS}

  const EXTRACT_PASSTHROUGH       : i32 = 0;
  const EXTRACT_LUMINANCE         : i32 = 1;
  const EXTRACT_LOG_LUMINANCE     : i32 = 2;
  const EXTRACT_MAX_BRIGHTNESS    : i32 = 3;
  const EXTRACT_HIGH_PASS         : i32 = 4;
  const EXTRACT_BAND_PASS         : i32 = 5;
  const EXTRACT_COLOR_KEY_RGB     : i32 = 6;
  const EXTRACT_COLOR_KEY_CHROMA  : i32 = 7;

  fn getLuminance(c: vec3f) -> f32 {
    return dot(c, vec3f(0.2126, 0.7152, 0.0722));
  }

  fn getMaxBrightness(c: vec3f) -> f32 {
    return max(max(c.r, c.g), c.b);
  }

  fn getChroma(c: vec3f) -> vec2f {
    // Cb, Cr only
    let y: f32  = getLuminance(c);
    let cb: f32 = 0.5 * (c.b - y) / (1.0 - 0.0722);
    let cr: f32 = 0.5 * (c.r - y) / (1.0 - 0.2126);
    return vec2f(cb, cr);
  }

  fn extractLogLuminance(color: vec3f) -> vec3f {
    let lum = getLuminance(color);
    return vec3f(log(max(lum, 1e-4)));
  }

  fn extractHighPass(color: vec3f, threshold: f32, knee: f32) -> vec3f {
    let lum: f32 = getMaxBrightness(color);

    let soft: f32 = clamp((lum - threshold + knee) / (2.0 * knee), 0.0, 1.0);
    let contribution: f32 = max(lum - threshold, 0.0) + soft * soft * knee;

    return color * contribution / max(lum, 1e-4);
  }

  fn extractBandpass(color: vec3f, threshold: f32, range: f32, knee: f32) -> vec3f {
    let lum: f32 = getLuminance(color);

    let thresholdLow: f32  = threshold;
    let thresholdHigh: f32 = threshold + range;

    let lowEdge: f32  = smoothstep(thresholdLow  - knee, thresholdLow  + knee, lum);
    let highEdge: f32 = 1.0 - smoothstep(thresholdHigh - knee, thresholdHigh + knee, lum);

    let weight: f32 = lowEdge * highEdge;
    return color * weight;
  }

  fn extractColorKeyRGB(color: vec3f, targetColor: vec3f, tolerance: f32, knee: f32) -> vec3f {
    let dist: f32 = distance(color, targetColor);
    let weight: f32 = smoothstep(tolerance - knee, tolerance + knee, dist);
    // weight = 0 near target color (keyed out), 1 far from it (kept)
    return color * weight;
  }

  fn extractColorKeyChroma(color: vec3f, targetColor: vec3f, tolerance: f32, knee: f32) -> vec3f {
    let keyChroma: vec2f = getChroma(targetColor);
    let pixChroma: vec2f = getChroma(color);
    let dist: f32 = distance(pixChroma, keyChroma);
    let weight: f32 = smoothstep(tolerance - knee, tolerance + knee, dist);
    return color * weight;
  }

  struct Uniforms {
    colorKey: vec3f,
    threshold: f32,
    range: f32,
    knee: f32,
    operatorId: i32,
  };

  // @block params
  @group(0) @binding(0) var<uniform> params: Uniforms;

  // @alias colorMap
  @group(0) @binding(1) var colorMap: texture_2d<f32>;
  @group(0) @binding(2) var colorMapSampler: sampler;

  fn extract(color: vec3f) -> vec3f {
    switch (params.operatorId) {
      case EXTRACT_LUMINANCE: {
        return vec3f(getLuminance(color));
      }
      case EXTRACT_LOG_LUMINANCE: {
        return vec3f(extractLogLuminance(color));
      }
      case EXTRACT_MAX_BRIGHTNESS: {
        return vec3f(getMaxBrightness(color));
      }
      case EXTRACT_HIGH_PASS: {
        return extractHighPass(color, params.threshold, params.knee);
      }
      case EXTRACT_BAND_PASS: {
        return extractBandpass(color, params.threshold, params.range, params.knee);
      }
      case EXTRACT_COLOR_KEY_RGB: {
        return extractColorKeyRGB(color, params.colorKey, params.threshold, params.knee);
      }
      case EXTRACT_COLOR_KEY_CHROMA: {
        return extractColorKeyChroma(color, params.colorKey, params.threshold, params.knee);
      }
      default: {
        return color;
      }
    }
  }

  @fragment
  fn main(in: FragmentInput) -> @location(0) vec4f {
    let color: vec3f = textureSample(colorMap, colorMapSampler, in.uv).rgb;
    return vec4f(extract(color), 1.0);
  }
`
