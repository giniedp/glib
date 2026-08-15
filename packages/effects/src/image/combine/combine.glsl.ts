const BASE = /* glsl */ `
  #version 300 es
  precision highp float;
  precision highp int;

  const int COMBINE_ADD                 = 0;
  const int COMBINE_SUBTRACT            = 1;
  const int COMBINE_MULTIPLY            = 2;
  const int COMBINE_DIVIDE              = 3;
  const int COMBINE_AVERAGE             = 4;
  const int COMBINE_MIN                 = 5;
  const int COMBINE_MAX                 = 6;
  const int COMBINE_ABSOLUTE_DIFFERENCE = 7;
  const int COMBINE_SATURATING_ADD      = 8;
  const int COMBINE_COLOR_DODGE         = 9;
  const int COMBINE_COLOR_BURN          = 10;
  const int COMBINE_LINEAR_BURN         = 11;

  vec3 combineColorDodge(vec3 a, vec3 b) {
    return min(a / max(1.0 - b, vec3(1e-5)), vec3(1.0));
  }

  vec3 combineColorBurn(vec3 a, vec3 b) {
    return 1.0 - min((1.0 - a) / max(b, vec3(1e-5)), vec3(1.0));
  }

  vec3 combineLinearBurn(vec3 a, vec3 b) {
    return max(a + b - 1.0, 0.0);
  }

  vec3 combineOperator(vec3 a, vec3 b, float weightA, float weightB, int mode) {
    vec3 wa = a * weightA;
    vec3 wb = b * weightB;

    switch (mode) {
      case COMBINE_SUBTRACT:
        return max(wa - wb, 0.0);
      case COMBINE_MULTIPLY:
        return wa * wb;
      case COMBINE_DIVIDE:
        return wa / max(wb, vec3(1e-5));
      case COMBINE_AVERAGE:
        return (wa + wb) * 0.5;
      case COMBINE_MIN:
        return min(wa, wb);
      case COMBINE_MAX:
        return max(wa, wb);
      case COMBINE_ABSOLUTE_DIFFERENCE:
        return abs(wa - wb);
      case COMBINE_SATURATING_ADD:
        return 1.0 - (1.0 - wa) * (1.0 - wb);
      case COMBINE_COLOR_DODGE:
        return combineColorDodge(wa, wb);
      case COMBINE_COLOR_BURN:
        return combineColorBurn(wa, wb);
      case COMBINE_LINEAR_BURN:
        return combineLinearBurn(wa, wb);
      default: // COMBINE_ADD
        return wa + wb;
    }
  }

  vec3 combine(vec3 a, vec3 b, float weightA, float weightB, float blendFactor, int mode) {
    vec3 result = combineOperator(a, b, weightA, weightB, mode);
    return mix(a, result, blendFactor);
  }
`

export const COMBINE_GLSL_FS = /* glsl */ `
  ${BASE}

  in vec2 uv;
  out vec4 fragColor;

  // @block params
  layout(std140) uniform Uniforms {
    float weightA;
    float weightB;
    float blendFactor; // applied uniformly to every mode: mix(a, operatorResult, blendFactor)
    int   operatorId;
  } params;

  // @alias colorMapA
  uniform sampler2D colorMapA;
  // @alias colorMapB
  uniform sampler2D colorMapB;

  void main() {
    vec3 a = texture(colorMapA, uv).rgb;
    vec3 b = texture(colorMapB, uv).rgb;

    vec3 result = combine(a, b, params.weightA, params.weightB, params.blendFactor, params.operatorId);
    fragColor = vec4(result, 1.0);
  }
`
