const BASE = /* glsl */ `
  #version 300 es
  precision highp float;
  precision highp int;

  vec3 upsamplePassthrough(sampler2D tex, vec2 uv) {
    return texture(tex, uv).rgb;
  }

  // Standard 3x3 tent filter upsample, widely used for bloom mip-chain composites
  vec3 upsampleTent3x3(sampler2D tex, vec2 uv, vec2 texelSize) {
    vec4 d = texelSize.xyxy * vec4(1.0, 1.0, -1.0, 0.0);

    vec3 s;
    s  = texture(tex, uv - d.xy).rgb;
    s += texture(tex, uv - d.wy).rgb * 2.0;
    s += texture(tex, uv - d.zy).rgb;

    s += texture(tex, uv + d.zw).rgb * 2.0;
    s += texture(tex, uv        ).rgb * 4.0;
    s += texture(tex, uv + d.xw).rgb * 2.0;

    s += texture(tex, uv + d.zy).rgb;
    s += texture(tex, uv + d.wy).rgb * 2.0;
    s += texture(tex, uv + d.xy).rgb;

    return s * (1.0 / 16.0);
  }

  // Dual-filter upsample, paired with downsampleKawase.
  // Marius Bjørge (ARM), SIGGRAPH 2015, "Bandwidth-Efficient Rendering"
  // (dual Kawase blur / dual-filter technique).
  vec3 upsampleKawase(sampler2D tex, vec2 uv, vec2 texelSize) {
    vec3 sum = vec3(0.0);

    sum += texture(tex, uv + vec2(-1.0, 0.0) * texelSize).rgb * 2.0;
    sum += texture(tex, uv + vec2( 1.0, 0.0) * texelSize).rgb * 2.0;
    sum += texture(tex, uv + vec2( 0.0,-1.0) * texelSize).rgb * 2.0;
    sum += texture(tex, uv + vec2( 0.0, 1.0) * texelSize).rgb * 2.0;

    sum += texture(tex, uv + vec2(-1.0,-1.0) * texelSize).rgb;
    sum += texture(tex, uv + vec2( 1.0,-1.0) * texelSize).rgb;
    sum += texture(tex, uv + vec2(-1.0, 1.0) * texelSize).rgb;
    sum += texture(tex, uv + vec2( 1.0, 1.0) * texelSize).rgb;

    return sum * (1.0 / 12.0);
  }

  // 9-tap Catmull-Rom bicubic upsample (GPU Gems 2, Sigg & Hadwiger 2005 —
  // "Fast Third-Order Texture Filtering"). Sharper than a tent filter,
  // avoids the blockiness of nearest/bilinear at larger scale factors.
  vec3 upsampleBicubic(sampler2D tex, vec2 uv, vec2 texelSize) {
    vec2 texSize = 1.0 / texelSize;
    vec2 samplePos = uv * texSize;
    vec2 texPos1 = floor(samplePos - 0.5) + 0.5;
    vec2 f = samplePos - texPos1;

    vec2 w0 = f * (-0.5 + f * (1.0 - 0.5 * f));
    vec2 w1 = 1.0 + f * f * (-2.5 + 1.5 * f);
    vec2 w2 = f * (0.5 + f * (2.0 - 1.5 * f));
    vec2 w3 = f * f * (-0.5 + 0.5 * f);

    vec2 w12 = w1 + w2;
    vec2 offset12 = w2 / w12;

    vec2 texPos0 = (texPos1 - 1.0) * texelSize;
    vec2 texPos3 = (texPos1 + 2.0) * texelSize;
    vec2 texPos12 = (texPos1 + offset12) * texelSize;

    vec3 result = vec3(0.0);
    result += texture(tex, vec2(texPos0.x,  texPos0.y)).rgb  * w0.x  * w0.y;
    result += texture(tex, vec2(texPos12.x, texPos0.y)).rgb  * w12.x * w0.y;
    result += texture(tex, vec2(texPos3.x,  texPos0.y)).rgb  * w3.x  * w0.y;

    result += texture(tex, vec2(texPos0.x,  texPos12.y)).rgb * w0.x  * w12.y;
    result += texture(tex, vec2(texPos12.x, texPos12.y)).rgb * w12.x * w12.y;
    result += texture(tex, vec2(texPos3.x,  texPos12.y)).rgb * w3.x  * w12.y;

    result += texture(tex, vec2(texPos0.x,  texPos3.y)).rgb  * w0.x  * w3.y;
    result += texture(tex, vec2(texPos12.x, texPos3.y)).rgb  * w12.x * w3.y;
    result += texture(tex, vec2(texPos3.x,  texPos3.y)).rgb  * w3.x  * w3.y;

    return result;
  }
`

export const UPSAMPLE_GLSL_FS = /* glsl */ `
  ${BASE}

  const int UPSAMPLE_PASSTHROUGH = 0;
  const int UPSAMPLE_TENT_3X3    = 1;
  const int UPSAMPLE_KAWASE      = 2;
  const int UPSAMPLE_BICUBIC     = 3;

  in vec2 uv;
  out vec4 fragColor;

  // @block params
  layout(std140) uniform Uniforms {
    int operatorId;
    float weight;
  } params;

  // @alias colorMap
  uniform sampler2D colorMap;

  vec3 upsample(int op) {
    vec2 texelSize = 1.0 / vec2(textureSize(colorMap, 0));
    switch (op) {
      case UPSAMPLE_TENT_3X3:
        return upsampleTent3x3(colorMap, uv, texelSize);
      case UPSAMPLE_KAWASE:
        return upsampleKawase(colorMap, uv, texelSize);
      case UPSAMPLE_BICUBIC:
        return upsampleBicubic(colorMap, uv, texelSize);
      default:
        return upsamplePassthrough(colorMap, uv);
    }
  }

  void main() {
    fragColor = vec4(params.weight * upsample(params.operatorId), 1.0);
  }
`
