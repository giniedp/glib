import { FULLSCREEN_WGSL_VS } from '../common.wgsl'

export const RESOLVE_MSAA_WGSL_FS = /* wgsl */ `
${FULLSCREEN_WGSL_VS}

const RESOLVE_PASSTHROUGH       : i32 = 0;
const RESOLVE_KARIS             : i32 = 1;
const RESOLVE_MIN               : i32 = 2;
const RESOLVE_MAX               : i32 = 3;

struct Uniforms {
  operatorId: i32,
};

// @block params
@group(0) @binding(0) var<uniform> params: Uniforms;
// @block params
@group(0) @binding(1) var colorMap: texture_multisampled_2d<f32>;

fn luminance(c: vec3f) -> f32 {
  return dot(c, vec3f(0.2126, 0.7152, 0.0722));
}

fn resolveKaris(uv: vec2i) -> vec4f {
  var sum = vec3f(0.0);
  var weight = 0.0;

  for (var i = 0; i < 4; i = i + 1) {
    let c = textureLoad(colorMap, uv, i).rgb;
    let w = 1.0 / (1.0 + luminance(c));
    sum += c * w;
    weight += w;
  }

  return vec4f(sum / weight, 1.0);
}

fn resolveMin(uv: vec2i) -> vec4f {
  var result = vec4f(0.0);

  for (var i = 0; i < 4; i = i + 1) {
    if (i == 0) {
      result = textureLoad(colorMap, uv, i);
    } else {
      result = min(result, textureLoad(colorMap, uv, i));
    }
  }

  return result;
}

fn resolveMax(uv: vec2i) -> vec4f {
  var result = vec4f(0.0);

  for (var i = 0; i < 4; i = i + 1) {
    if (i == 0) {
      result = textureLoad(colorMap, uv, i);
    } else {
      result = max(result, textureLoad(colorMap, uv, i));
    }
  }

  return result;
}

@fragment
fn fs_main(in: FragmentInput) -> @location(0) vec4f {
  return vec4f(1.0,0.0,0.0,1.0);
  // let uv = vec2i(in.position.xy);
  // switch (params.operatorId) {
  //   case RESOLVE_KARIS: {
  //     return resolveKaris(uv);
  //   }
  //   case RESOLVE_MIN: {
  //     return resolveMin(uv);
  //   }
  //   case RESOLVE_MAX: {
  //     return resolveMax(uv);
  //   }
  //   default: {
  //     return textureLoad(colorMap, uv, 0);
  //   }
  // }
}
`
