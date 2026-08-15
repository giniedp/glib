// https://github.com/KhronosGroup/glTF-Sample-Renderer/blob/main/source/shaders/ibl_filtering.frag

import { FULLSCREEN_WGSL_VS } from '../image/common.wgsl'
import { IBL_BASE_WGSL } from './ibl-base.wgsl'

export const IBL_BRDF_LUT_WGSL = /* wgsl */ `
  ${FULLSCREEN_WGSL_VS}
  ${IBL_BASE_WGSL}

  // Compute LUT for GGX distribution.
  // See https://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf
  fn LUT(NdotV: f32, roughness: f32, samples: i32, distribution: i32) -> vec3f {
    // Compute spherical view vector: (sin(phi), 0, cos(phi))
    let V = vec3f(sqrt(1.0 - NdotV * NdotV), 0.0, NdotV);

    // The macro surface normal just points up.
    let N = vec3f(0.0, 0.0, 1.0);

    var A = 0.0;
    var B = 0.0;
    var C = 0.0;

    for (var i: i32 = 0; i < samples; i++) {
      let importanceSample = getImportanceSample(i, N, roughness, samples, distribution);
      let H = importanceSample.xyz;
      let L = normalize(reflect(-V, H));

      let NdotL = saturate(L.z);
      let NdotH = saturate(H.z);
      let VdotH = saturate(dot(V, H));
      if (NdotL > 0.0) {
        if (distribution == DISTRIBUTION_GGX) {
          // LUT for GGX distribution.
          let V_pdf = V_SmithGGXCorrelated(NdotV, NdotL, roughness) * VdotH * NdotL / NdotH;
          let Fc = pow(1.0 - VdotH, 5.0);
          A += (1.0 - Fc) * V_pdf;
          B += Fc * V_pdf;
          C += 0.0;
        }

        if (distribution == DISTRIBUTION_CHARLIE) {
          // LUT for Charlie distribution.
          let sheenDistribution = D_Charlie(roughness, NdotH);
          let sheenVisibility = V_Ashikhmin(NdotL, NdotV);

          A += 0.0;
          B += 0.0;
          C += sheenVisibility * sheenDistribution * NdotL * VdotH;
        }
      }
    }

    // pdf(v,h) -> NDF * <nh>; Jacobian transform to pdf(v,l); the 4 pulled out of the integral.
    return vec3f(4.0 * A, 4.0 * B, 4.0 * 2.0 * MATH_PI * C) / f32(samples);
  }


  struct Uniforms {
    samples         : i32,
    distribution    : i32, // enum: DISTRIBUTION_*
    floatTexture    : i32, // 0: byte, 1: float
    intensity       : f32,
  };

  // @block params
  @group(0) @binding(0) var<uniform> params: Uniforms;

  @fragment
  fn fs(in: FragmentInput) -> @location(0) vec4f {
    var color = LUT(
      in.uv.x, // NdotV
      in.uv.y, // roughness
      params.samples,
      params.distribution,
    );
    if (params.floatTexture == 0) {
      color /= params.intensity;
      color = clamp(color, vec3f(0.0), vec3f(1.0));
    }

    return vec4f(color, 1.0);
  }
`
