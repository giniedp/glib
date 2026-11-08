import { FULLSCREEN_WGSL_VS } from '../common.wgsl'

export const DOWNSAMPLE_WGSL_FS = /* wgsl */ `
  ${FULLSCREEN_WGSL_VS}

  fn getLuminance(c: vec3f) -> f32 {
    return dot(c, vec3f(0.2126, 0.7152, 0.0722));
  }

  // high pass of the bloom threshold (extract.wgsl EXTRACT_HIGH_PASS), applied to every tap when params.highPass is set
  fn highPass(color: vec3f) -> vec3f {
    let lum = max(max(color.r, color.g), color.b);
    let soft = clamp((lum - params.threshold + params.knee) / max(2.0 * params.knee, 1e-4), 0.0, 1.0);
    let contribution = max(lum - params.threshold, 0.0) + soft * soft * params.knee;
    return color * contribution / max(lum, 1e-4);
  }

  fn tap(tex: texture_2d<f32>, samp: sampler, uv: vec2f) -> vec4f {
    let c = textureSample(tex, samp, uv);
    if (params.highPass != 0) {
      return vec4f(highPass(c.rgb), c.a);
    }
    return c;
  }

  fn downsampleBilinear2x2(tex: texture_2d<f32>, samp: sampler, uv: vec2f) -> vec4f {
    // relies on the sampler already being linear-filtered
    return tap(tex, samp, uv);
  }

  fn downsampleBilinear4x4(tex: texture_2d<f32>, samp: sampler, uv: vec2f, texelSize: vec2f) -> vec4f {
    var sum: vec4f = vec4f(0.0);
    sum += tap(tex, samp, uv + vec2f(-1.0,-1.0) * texelSize);
    sum += tap(tex, samp, uv + vec2f( 1.0,-1.0) * texelSize);
    sum += tap(tex, samp, uv + vec2f(-1.0, 1.0) * texelSize);
    sum += tap(tex, samp, uv + vec2f( 1.0, 1.0) * texelSize);
    return sum * 0.25;
  }

  fn downsampleKawase(tex: texture_2d<f32>, samp: sampler, uv: vec2f, texelSize: vec2f) -> vec4f {
    var sum: vec4f = vec4f(0.0);
    sum += tap(tex, samp, uv) * 4.0;
    sum += tap(tex, samp, uv + vec2f(-1.0,-1.0) * texelSize);
    sum += tap(tex, samp, uv + vec2f( 1.0,-1.0) * texelSize);
    sum += tap(tex, samp, uv + vec2f(-1.0, 1.0) * texelSize);
    sum += tap(tex, samp, uv + vec2f( 1.0, 1.0) * texelSize);
    return sum * 0.125;
  }

  // custom 13-tap downsample kernel (36 texel lookups w/ bilinear filtering),
  // developed at Sledgehammer Games, presented by Jorge Jimenez at SIGGRAPH 2014,
  // "Next Generation Post Processing in Call of Duty: Advanced Warfare"
  // https://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare/
  fn downsampleJimenez13Tap(tex: texture_2d<f32>, samp: sampler, uv: vec2f, texelSize: vec2f) -> vec4f {
    let a = tap(tex, samp, uv + vec2f(-1.0,-1.0) * texelSize);
    let b = tap(tex, samp, uv + vec2f( 0.0,-1.0) * texelSize);
    let c = tap(tex, samp, uv + vec2f( 1.0,-1.0) * texelSize);

    let d = tap(tex, samp, uv + vec2f(-0.5,-0.5) * texelSize);
    let e = tap(tex, samp, uv + vec2f( 0.5,-0.5) * texelSize);

    let f = tap(tex, samp, uv + vec2f(-1.0, 0.0) * texelSize);
    let g = tap(tex, samp, uv);
    let h = tap(tex, samp, uv + vec2f( 1.0, 0.0) * texelSize);

    let i = tap(tex, samp, uv + vec2f(-0.5, 0.5) * texelSize);
    let j = tap(tex, samp, uv + vec2f( 0.5, 0.5) * texelSize);

    let k = tap(tex, samp, uv + vec2f(-1.0, 1.0) * texelSize);
    let l = tap(tex, samp, uv + vec2f( 0.0, 1.0) * texelSize);
    let m = tap(tex, samp, uv + vec2f( 1.0, 1.0) * texelSize);

    let center      = (d + e + i + j) * 0.5;
    let topLeft     = (a + b + f + g) * 0.125;
    let topRight    = (b + c + g + h) * 0.125;
    let bottomLeft  = (f + g + k + l) * 0.125;
    let bottomRight = (g + h + l + m) * 0.125;

    return center * 0.5 + (topLeft + topRight + bottomLeft + bottomRight) * 0.125;
  }

  // https://graphicrants.blogspot.com/2013/12/
  fn karisWeight(c: vec4f) -> f32 {
    return (1.0 / (1.0 + getLuminance(c.rgb)));
  }

  // Anti-firefly weighted average, credited to Brian Karis (Epic/UE4),
  // as referenced in Jimenez's SIGGRAPH 2014 talk for firefly suppression
  // on the first HDR downsample step.
  fn karisAverage4(c1: vec4f, c2: vec4f, c3: vec4f, c4: vec4f) -> vec4f {
    let w1 = karisWeight(c1);
    let w2 = karisWeight(c2);
    let w3 = karisWeight(c3);
    let w4 = karisWeight(c4);
    let wSum = w1 + w2 + w3 + w4;
    return (c1 * w1 + c2 * w2 + c3 * w3 + c4 * w4) / wSum;
  }

  fn karisAverage5(c1: vec4f, c2: vec4f, c3: vec4f, c4: vec4f, c5: vec4f) -> vec4f {
    let w1 = karisWeight(c1);
    let w2 = karisWeight(c2);
    let w3 = karisWeight(c3);
    let w4 = karisWeight(c4);
    let w5 = karisWeight(c5);
    let wSum = w1 + w2 + w3 + w4 + w5;
    return (c1 * w1 + c2 * w2 + c3 * w3 + c4 * w4 + c5 * w5) / wSum;
  }

  fn downsampleJimenez13TapKaris(tex: texture_2d<f32>, samp: sampler, uv: vec2f, texelSize: vec2f) -> vec4f {
    let a = tap(tex, samp, uv + vec2f(-1.0,-1.0) * texelSize);
    let b = tap(tex, samp, uv + vec2f( 0.0,-1.0) * texelSize);
    let c = tap(tex, samp, uv + vec2f( 1.0,-1.0) * texelSize);
    let d = tap(tex, samp, uv + vec2f(-0.5,-0.5) * texelSize);
    let e = tap(tex, samp, uv + vec2f( 0.5,-0.5) * texelSize);
    let f = tap(tex, samp, uv + vec2f(-1.0, 0.0) * texelSize);
    let g = tap(tex, samp, uv);
    let h = tap(tex, samp, uv + vec2f( 1.0, 0.0) * texelSize);
    let i = tap(tex, samp, uv + vec2f(-0.5, 0.5) * texelSize);
    let j = tap(tex, samp, uv + vec2f( 0.5, 0.5) * texelSize);
    let k = tap(tex, samp, uv + vec2f(-1.0, 1.0) * texelSize);
    let l = tap(tex, samp, uv + vec2f( 0.0, 1.0) * texelSize);
    let m = tap(tex, samp, uv + vec2f( 1.0, 1.0) * texelSize);

    // let center      = karisAverage4(d, e, i, j);
    // let topLeft     = karisAverage4(a, b, f, g);
    // let topRight    = karisAverage4(b, c, g, h);
    // let bottomLeft  = karisAverage4(f, g, k, l);
    // let bottomRight = karisAverage4(g, h, l, m);
    // return center * 0.5 + (topLeft + topRight + bottomLeft + bottomRight) * 0.125;

    // var center      = (d + e + i + j) * 0.5;
    // var topLeft     = (a + b + f + g) * 0.125;
    // var topRight    = (b + c + g + h) * 0.125;
    // var bottomLeft  = (f + g + k + l) * 0.125;
    // var bottomRight = (g + h + l + m) * 0.125;
    // return karisAverage5(center, topLeft, topRight, bottomLeft, bottomRight);

    var center      = (d + e + i + j) * 0.5;
    var topLeft     = (a + b + f + g) * 0.125;
    var topRight    = (b + c + g + h) * 0.125;
    var bottomLeft  = (f + g + k + l) * 0.125;
    var bottomRight = (g + h + l + m) * 0.125;

    center *= karisWeight(center);
    topLeft *= karisWeight(topLeft);
    topRight *= karisWeight(topRight);
    bottomLeft *= karisWeight(bottomLeft);
    bottomRight *= karisWeight(bottomRight);

    // return center + (topLeft + topRight + bottomLeft + bottomRight);
    return center * 0.5 + (topLeft + topRight + bottomLeft + bottomRight) * 0.125;
  }

  const DOWNSAMPLE_BILINEAR_2X2: i32        = 0;
  const DOWNSAMPLE_BILINEAR_4X4: i32        = 1;
  const DOWNSAMPLE_KAWASE: i32              = 2;
  const DOWNSAMPLE_JIMENEZ_13TAP: i32       = 3;
  const DOWNSAMPLE_JIMENEZ_13TAP_KARIS: i32 = 4;

  struct Uniforms {
    operatorId: i32,
    highPass: i32,
    threshold: f32,
    knee: f32,
  };

  // @block params
  @group(0) @binding(0) var<uniform> params: Uniforms;

  // @alias colorMap
  @group(0) @binding(1) var colorMap: texture_2d<f32>;
  @group(0) @binding(2) var colorMapSampler: sampler;

  fn downsample(uv: vec2f) -> vec4f {
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
    let result = downsample(in.uv);
    return vec4f(result.rgb, saturate(result.a));
  }
`
