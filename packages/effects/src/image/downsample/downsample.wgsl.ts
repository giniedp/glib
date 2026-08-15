import { FULLSCREEN_WGSL_VS } from '../common.wgsl'

export const DOWNSAMPLE_WGSL_FS = /* wgsl */ `
  ${FULLSCREEN_WGSL_VS}

  fn getMaxBrightness(c: vec3f) -> f32 {
    return max(max(c.r, c.g), c.b);
  }

  fn downsampleBilinear2x2(tex: texture_2d<f32>, samp: sampler, uv: vec2f) -> vec3f {
    // relies on the sampler already being linear-filtered
    return textureSample(tex, samp, uv).rgb;
  }

  fn downsampleBilinear4x4(tex: texture_2d<f32>, samp: sampler, uv: vec2f, texelSize: vec2f) -> vec3f {
    var sum: vec3f = vec3f(0.0);
    sum += textureSample(tex, samp, uv + vec2f(-1.0,-1.0) * texelSize).rgb;
    sum += textureSample(tex, samp, uv + vec2f( 1.0,-1.0) * texelSize).rgb;
    sum += textureSample(tex, samp, uv + vec2f(-1.0, 1.0) * texelSize).rgb;
    sum += textureSample(tex, samp, uv + vec2f( 1.0, 1.0) * texelSize).rgb;
    return sum * 0.25;
  }

  fn downsampleKawase(tex: texture_2d<f32>, samp: sampler, uv: vec2f, texelSize: vec2f) -> vec3f {
    var sum: vec3f = vec3f(0.0);
    sum += textureSample(tex, samp, uv).rgb * 4.0;
    sum += textureSample(tex, samp, uv + vec2f(-1.0,-1.0) * texelSize).rgb;
    sum += textureSample(tex, samp, uv + vec2f( 1.0,-1.0) * texelSize).rgb;
    sum += textureSample(tex, samp, uv + vec2f(-1.0, 1.0) * texelSize).rgb;
    sum += textureSample(tex, samp, uv + vec2f( 1.0, 1.0) * texelSize).rgb;
    return sum * 0.125;
  }

  // custom 13-tap downsample kernel (36 texel lookups w/ bilinear filtering),
  // developed at Sledgehammer Games, presented by Jorge Jimenez at SIGGRAPH 2014,
  // "Next Generation Post Processing in Call of Duty: Advanced Warfare"
  // https://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare/
  fn downsampleJimenez13Tap(tex: texture_2d<f32>, samp: sampler, uv: vec2f, texelSize: vec2f) -> vec3f {
    let a = textureSample(tex, samp, uv + vec2f(-1.0,-1.0) * texelSize).rgb;
    let b = textureSample(tex, samp, uv + vec2f( 0.0,-1.0) * texelSize).rgb;
    let c = textureSample(tex, samp, uv + vec2f( 1.0,-1.0) * texelSize).rgb;

    let d = textureSample(tex, samp, uv + vec2f(-0.5,-0.5) * texelSize).rgb;
    let e = textureSample(tex, samp, uv + vec2f( 0.5,-0.5) * texelSize).rgb;

    let f = textureSample(tex, samp, uv + vec2f(-1.0, 0.0) * texelSize).rgb;
    let g = textureSample(tex, samp, uv).rgb;
    let h = textureSample(tex, samp, uv + vec2f( 1.0, 0.0) * texelSize).rgb;

    let i = textureSample(tex, samp, uv + vec2f(-0.5, 0.5) * texelSize).rgb;
    let j = textureSample(tex, samp, uv + vec2f( 0.5, 0.5) * texelSize).rgb;

    let k = textureSample(tex, samp, uv + vec2f(-1.0, 1.0) * texelSize).rgb;
    let l = textureSample(tex, samp, uv + vec2f( 0.0, 1.0) * texelSize).rgb;
    let m = textureSample(tex, samp, uv + vec2f( 1.0, 1.0) * texelSize).rgb;

    let center      = (d + e + i + j) * 0.5;
    let topLeft     = (a + b + f + g) * 0.125;
    let topRight    = (b + c + g + h) * 0.125;
    let bottomLeft  = (f + g + k + l) * 0.125;
    let bottomRight = (g + h + l + m) * 0.125;

    return center * 0.5 + (topLeft + topRight + bottomLeft + bottomRight) * 0.125;
  }

  // Anti-firefly weighted average, credited to Brian Karis (Epic/UE4),
  // as referenced in Jimenez's SIGGRAPH 2014 talk for firefly suppression
  // on the first HDR downsample step.
  fn karisAverage(c1: vec3f, c2: vec3f, c3: vec3f, c4: vec3f) -> vec3f {
    let w1 = 1.0 / (1.0 + getMaxBrightness(c1));
    let w2 = 1.0 / (1.0 + getMaxBrightness(c2));
    let w3 = 1.0 / (1.0 + getMaxBrightness(c3));
    let w4 = 1.0 / (1.0 + getMaxBrightness(c4));
    let wSum = w1 + w2 + w3 + w4;
    return (c1 * w1 + c2 * w2 + c3 * w3 + c4 * w4) / max(wSum, 1e-4);
  }

  fn downsampleJimenez13TapKaris(tex: texture_2d<f32>, samp: sampler, uv: vec2f, texelSize: vec2f) -> vec3f {
    let a = textureSample(tex, samp, uv + vec2f(-1.0,-1.0) * texelSize).rgb;
    let b = textureSample(tex, samp, uv + vec2f( 0.0,-1.0) * texelSize).rgb;
    let c = textureSample(tex, samp, uv + vec2f( 1.0,-1.0) * texelSize).rgb;
    let d = textureSample(tex, samp, uv + vec2f(-0.5,-0.5) * texelSize).rgb;
    let e = textureSample(tex, samp, uv + vec2f( 0.5,-0.5) * texelSize).rgb;
    let f = textureSample(tex, samp, uv + vec2f(-1.0, 0.0) * texelSize).rgb;
    let g = textureSample(tex, samp, uv).rgb;
    let h = textureSample(tex, samp, uv + vec2f( 1.0, 0.0) * texelSize).rgb;
    let i = textureSample(tex, samp, uv + vec2f(-0.5, 0.5) * texelSize).rgb;
    let j = textureSample(tex, samp, uv + vec2f( 0.5, 0.5) * texelSize).rgb;
    let k = textureSample(tex, samp, uv + vec2f(-1.0, 1.0) * texelSize).rgb;
    let l = textureSample(tex, samp, uv + vec2f( 0.0, 1.0) * texelSize).rgb;
    let m = textureSample(tex, samp, uv + vec2f( 1.0, 1.0) * texelSize).rgb;

    let center      = karisAverage(d, e, i, j);
    let topLeft     = karisAverage(a, b, f, g);
    let topRight    = karisAverage(b, c, g, h);
    let bottomLeft  = karisAverage(f, g, k, l);
    let bottomRight = karisAverage(g, h, l, m);

    return center * 0.5 + (topLeft + topRight + bottomLeft + bottomRight) * 0.125;
  }

  const DOWNSAMPLE_BILINEAR_2X2: i32        = 0;
  const DOWNSAMPLE_BILINEAR_4X4: i32        = 1;
  const DOWNSAMPLE_KAWASE: i32              = 2;
  const DOWNSAMPLE_JIMENEZ_13TAP: i32       = 3;
  const DOWNSAMPLE_JIMENEZ_13TAP_KARIS: i32 = 4;

  struct Uniforms {
    operatorId: i32,
  };

  // @block params
  @group(0) @binding(0) var<uniform> params: Uniforms;

  // @alias colorMap
  @group(0) @binding(1) var colorMap: texture_2d<f32>;
  @group(0) @binding(2) var colorMapSampler: sampler;

  fn downsample(uv: vec2f) -> vec3f {
    let texelSize: vec2f = 1.0 / vec2f(textureDimensions(colorMap, 0));

    switch (params.operatorId) {
      case DOWNSAMPLE_BILINEAR_4X4: {
        return downsampleBilinear4x4(colorMap, colorMapSampler, uv, texelSize);
      }
      case DOWNSAMPLE_KAWASE: {
        return downsampleKawase(colorMap, colorMapSampler, uv, texelSize);
      }
      case DOWNSAMPLE_JIMENEZ_13TAP: {
        return downsampleJimenez13Tap(colorMap, colorMapSampler, uv, texelSize);
      }
      case DOWNSAMPLE_JIMENEZ_13TAP_KARIS: {
        return downsampleJimenez13TapKaris(colorMap, colorMapSampler, uv, texelSize);
      }
      default: {
        return downsampleBilinear2x2(colorMap, colorMapSampler, uv);
      }
    }
  }

  @fragment
  fn fs(in: FragmentInput) -> @location(0) vec4f {
    return vec4f(downsample(in.uv), 1.0);
  }
`
