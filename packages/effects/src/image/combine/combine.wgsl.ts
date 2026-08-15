import { FULLSCREEN_WGSL_VS } from '../common.wgsl'

export const COMBINE_WGSL_FS = /* wgsl */ `
  ${FULLSCREEN_WGSL_VS}

  const COMBINE_ADD                 : i32 = 0;
  const COMBINE_SUBTRACT            : i32 = 1;
  const COMBINE_MULTIPLY            : i32 = 2;
  const COMBINE_DIVIDE              : i32 = 3;
  const COMBINE_AVERAGE             : i32 = 4;
  const COMBINE_MIN                 : i32 = 5;
  const COMBINE_MAX                 : i32 = 6;
  const COMBINE_ABSOLUTE_DIFFERENCE : i32 = 7;
  const COMBINE_SATURATING_ADD      : i32 = 8;
  const COMBINE_COLOR_DODGE         : i32 = 9;
  const COMBINE_COLOR_BURN          : i32 = 10;
  const COMBINE_LINEAR_BURN         : i32 = 11;

  fn combineColorDodge(a: vec3f, b: vec3f) -> vec3f {
    return min(a / max(1.0 - b, vec3f(1e-5)), vec3f(1.0));
  }

  fn combineColorBurn(a: vec3f, b: vec3f) -> vec3f {
    return 1.0 - min((1.0 - a) / max(b, vec3f(1e-5)), vec3f(1.0));
  }

  fn combineLinearBurn(a: vec3f, b: vec3f) -> vec3f {
    return max(a + b - 1.0, vec3f(0.0));
  }

  fn combineOperator(a: vec3f, b: vec3f, weightA: f32, weightB: f32, mode: i32) -> vec3f {
    let wa = a * weightA;
    let wb = b * weightB;

    switch (mode) {
      case COMBINE_SUBTRACT: {
        return max(wa - wb, vec3f(0.0));
      }
      case COMBINE_MULTIPLY: {
        return wa * wb;
      }
      case COMBINE_DIVIDE: {
        return wa / max(wb, vec3f(1e-5));
      }
      case COMBINE_AVERAGE: {
        return (wa + wb) * 0.5;
      }
      case COMBINE_MIN: {
        return min(wa, wb);
      }
      case COMBINE_MAX: {
        return max(wa, wb);
      }
      case COMBINE_ABSOLUTE_DIFFERENCE: {
        return abs(wa - wb);
      }
      case COMBINE_SATURATING_ADD: {
        return 1.0 - (1.0 - wa) * (1.0 - wb);
      }
      case COMBINE_COLOR_DODGE: {
        return combineColorDodge(wa, wb);
      }
      case COMBINE_COLOR_BURN: {
        return combineColorBurn(wa, wb);
      }
      case COMBINE_LINEAR_BURN: {
        return combineLinearBurn(wa, wb);
      }
      default: { // COMBINE_ADD
        return wa + wb;
      }
    }
  }

  // blendFactor mixes between the untouched input A and the operator's result,
  // same role as Unity Shader Graph's "Opacity" — 0 = pure A, 1 = full operator result.
  fn combine(a: vec3f, b: vec3f, weightA: f32, weightB: f32, blendFactor: f32, mode: i32) -> vec3f {
    let result = combineOperator(a, b, weightA, weightB, mode);
    return mix(a, result, blendFactor);
  }

  struct Uniforms {
    weightA: f32,
    weightB: f32,
    blendFactor: f32, // applied uniformly to every mode: mix(a, operatorResult, blendFactor)
    operatorId: i32,
  };

  // @block params
  @group(0) @binding(0) var<uniform> params: Uniforms;

  // @alias colorMapA
  @group(0) @binding(1) var colorMapA: texture_2d<f32>;
  @group(0) @binding(2) var colorMapASampler: sampler;

  // @alias colorMapB
  @group(0) @binding(3) var colorMapB: texture_2d<f32>;
  @group(0) @binding(4) var colorMapBSampler: sampler;

  @fragment
  fn fs(in: FragmentInput) -> @location(0) vec4f {
    let a = textureSample(colorMapA, colorMapASampler, in.uv).rgb;
    let b = textureSample(colorMapB, colorMapBSampler, in.uv).rgb;

    let result = combine(a, b, params.weightA, params.weightB, params.blendFactor, params.operatorId);
    return vec4f(result, 1.0);
  }
`
