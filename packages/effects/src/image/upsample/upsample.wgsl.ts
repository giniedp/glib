import { FULLSCREEN_WGSL_VS } from '../common.wgsl'

export const UPSAMPLE_WGSL_FS = /* wgsl */ `
  ${FULLSCREEN_WGSL_VS}

  fn upsamplePassthrough(tex: texture_2d<f32>, samp: sampler, uv: vec2f) -> vec3f {
    return textureSample(tex, samp, uv).rgb;
  }

  // Standard 3x3 tent filter upsample, widely used for bloom mip-chain composites
  fn upsampleTent3x3(tex: texture_2d<f32>, samp: sampler, uv: vec2f, texelSize: vec2f) -> vec3f {
    let d = texelSize.xyxy * vec4f(1.0, 1.0, -1.0, 0.0);

    var s: vec3f;
    s  = textureSample(tex, samp, uv - d.xy).rgb;
    s += textureSample(tex, samp, uv - d.wy).rgb * 2.0;
    s += textureSample(tex, samp, uv - d.zy).rgb;

    s += textureSample(tex, samp, uv + d.zw).rgb * 2.0;
    s += textureSample(tex, samp, uv       ).rgb * 4.0;
    s += textureSample(tex, samp, uv + d.xw).rgb * 2.0;

    s += textureSample(tex, samp, uv + d.zy).rgb;
    s += textureSample(tex, samp, uv + d.wy).rgb * 2.0;
    s += textureSample(tex, samp, uv + d.xy).rgb;

    return s * (1.0 / 16.0);
  }

  // Dual-filter upsample, paired with downsampleKawase.
  // Marius Bjørge (ARM), SIGGRAPH 2015, "Bandwidth-Efficient Rendering"
  // (dual Kawase blur / dual-filter technique).
  fn upsampleKawase(tex: texture_2d<f32>, samp: sampler, uv: vec2f, texelSize: vec2f) -> vec3f {
    var sum: vec3f = vec3f(0.0);

    sum += textureSample(tex, samp, uv + vec2f(-1.0, 0.0) * texelSize).rgb * 2.0;
    sum += textureSample(tex, samp, uv + vec2f( 1.0, 0.0) * texelSize).rgb * 2.0;
    sum += textureSample(tex, samp, uv + vec2f( 0.0,-1.0) * texelSize).rgb * 2.0;
    sum += textureSample(tex, samp, uv + vec2f( 0.0, 1.0) * texelSize).rgb * 2.0;

    sum += textureSample(tex, samp, uv + vec2f(-1.0,-1.0) * texelSize).rgb;
    sum += textureSample(tex, samp, uv + vec2f( 1.0,-1.0) * texelSize).rgb;
    sum += textureSample(tex, samp, uv + vec2f(-1.0, 1.0) * texelSize).rgb;
    sum += textureSample(tex, samp, uv + vec2f( 1.0, 1.0) * texelSize).rgb;

    return sum * (1.0 / 12.0);
  }

  // 9-tap Catmull-Rom bicubic upsample (GPU Gems 2, Sigg & Hadwiger 2005 —
  // "Fast Third-Order Texture Filtering"). Sharper than a tent filter,
  // avoids the blockiness of nearest/bilinear at larger scale factors.
  fn upsampleBicubic(tex: texture_2d<f32>, samp: sampler, uv: vec2f, texelSize: vec2f) -> vec3f {
    let texSize = 1.0 / texelSize;
    let samplePos = uv * texSize;
    let texPos1 = floor(samplePos - 0.5) + 0.5;
    let f = samplePos - texPos1;

    let w0 = f * (-0.5 + f * (1.0 - 0.5 * f));
    let w1 = 1.0 + f * f * (-2.5 + 1.5 * f);
    let w2 = f * (0.5 + f * (2.0 - 1.5 * f));
    let w3 = f * f * (-0.5 + 0.5 * f);

    let w12 = w1 + w2;
    let offset12 = w2 / w12;

    let texPos0 = (texPos1 - 1.0) * texelSize;
    let texPos3 = (texPos1 + 2.0) * texelSize;
    let texPos12 = (texPos1 + offset12) * texelSize;

    var result: vec3f = vec3f(0.0);
    result += textureSample(tex, samp, vec2f(texPos0.x,  texPos0.y)).rgb  * w0.x  * w0.y;
    result += textureSample(tex, samp, vec2f(texPos12.x, texPos0.y)).rgb  * w12.x * w0.y;
    result += textureSample(tex, samp, vec2f(texPos3.x,  texPos0.y)).rgb  * w3.x  * w0.y;

    result += textureSample(tex, samp, vec2f(texPos0.x,  texPos12.y)).rgb * w0.x  * w12.y;
    result += textureSample(tex, samp, vec2f(texPos12.x, texPos12.y)).rgb * w12.x * w12.y;
    result += textureSample(tex, samp, vec2f(texPos3.x,  texPos12.y)).rgb * w3.x  * w12.y;

    result += textureSample(tex, samp, vec2f(texPos0.x,  texPos3.y)).rgb  * w0.x  * w3.y;
    result += textureSample(tex, samp, vec2f(texPos12.x, texPos3.y)).rgb  * w12.x * w3.y;
    result += textureSample(tex, samp, vec2f(texPos3.x,  texPos3.y)).rgb  * w3.x  * w3.y;

    return result;
  }

  const UPSAMPLE_PASSTHROUGH: i32 = 0;
  const UPSAMPLE_TENT_3X3: i32    = 1;
  const UPSAMPLE_KAWASE: i32      = 2;
  const UPSAMPLE_BICUBIC: i32     = 3;

  struct Uniforms {
    operatorId: i32,
    weight: f32,
  };

  // @block params
  @group(0) @binding(0) var<uniform> params: Uniforms;

  // @alias colorMap
  @group(0) @binding(1) var colorMap: texture_2d<f32>;
  @group(0) @binding(2) var colorMapSampler: sampler;

  fn upsample(uv: vec2f) -> vec3f {
    let texelSize: vec2f = 1.0 / vec2f(textureDimensions(colorMap, 0));

    switch (params.operatorId) {
      case UPSAMPLE_TENT_3X3: {
        return upsampleTent3x3(colorMap, colorMapSampler, uv, texelSize);
      }
      case UPSAMPLE_KAWASE: {
        return upsampleKawase(colorMap, colorMapSampler, uv, texelSize);
      }
      case UPSAMPLE_BICUBIC: {
        return upsampleBicubic(colorMap, colorMapSampler, uv, texelSize);
      }
      default: {
        return upsamplePassthrough(colorMap, colorMapSampler, uv);
      }
    }
  }

  @fragment
  fn fs(in: FragmentInput) -> @location(0) vec4f {
    return vec4f(params.weight * upsample(in.uv), 1.0);
  }
`
