// taken from:
//  https://github.com/KhronosGroup/glTF-Sample-Renderer/blob/main/source/shaders/ibl_filtering.frag

import { IBL_BASE_GLSL } from './ibl-base.glsl'

export const IBL_BRDF_LUT_GLSL = /* glsl */ `
  #version 300 es
  precision highp float;
  precision highp int;

  ${IBL_BASE_GLSL}

  // Compute LUT for GGX distribution.
  // See https://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf
  vec3 LUT(float NdotV, float roughness, int samples, int distribution) {
    // Compute spherical view vector: (sin(phi), 0, cos(phi))
    vec3 V = vec3(sqrt(1.0 - NdotV * NdotV), 0.0, NdotV);

    // The macro surface normal just points up.
    vec3 N = vec3(0.0, 0.0, 1.0);

    // To make the LUT independant from the material's F0, which is part of the Fresnel term
    // when substituted by Schlick's approximation, we factor it out of the integral,
    // yielding to the form: F0 * I1 + I2
    // I1 and I2 are slighlty different in the Fresnel term, but both only depend on
    // NoL and roughness, so they are both numerically integrated and written into two channels.
    float A = 0.0;
    float B = 0.0;
    float C = 0.0;

    for(int i = 0; i < samples; ++i) {
      // Importance sampling, depending on the distribution.
      vec4 importanceSample = getImportanceSample(i, N, roughness, samples, distribution);
      vec3 H = importanceSample.xyz;
      // float pdf = importanceSample.w;
      vec3 L = normalize(reflect(-V, H));

      float NdotL = saturate(L.z);
      float NdotH = saturate(H.z);
      float VdotH = saturate(dot(V, H));
      if (NdotL > 0.0) {
        if (distribution == DIST_GGX) {
          // LUT for GGX distribution.

          // Taken from: https://bruop.github.io/ibl
          // Shadertoy: https://www.shadertoy.com/view/3lXXDB
          // Terms besides V are from the GGX PDF we're dividing by.
          float V_pdf = V_SmithGGXCorrelated(NdotV, NdotL, roughness) * VdotH * NdotL / NdotH;
          float Fc = pow(1.0 - VdotH, 5.0);
          A += (1.0 - Fc) * V_pdf;
          B += Fc * V_pdf;
          C += 0.0;
        }

        if (distribution == DIST_CHARLIE) {
          // LUT for Charlie distribution.
          float sheenDistribution = D_Charlie(roughness, NdotH);
          float sheenVisibility = V_Ashikhmin(NdotL, NdotV);

          A += 0.0;
          B += 0.0;
          C += sheenVisibility * sheenDistribution * NdotL * VdotH;
        }
      }
    }

    // The PDF is simply pdf(v, h) -> NDF * <nh>.
    // To parametrize the PDF over l, use the Jacobian transform, yielding to: pdf(v, l) -> NDF * <nh> / 4<vh>
    // Since the BRDF divide through the PDF to be normalized, the 4 can be pulled out of the integral.
    return vec3(4.0 * A, 4.0 * B, 4.0 * 2.0 * MATH_PI * C) / float(samples);
  }

  // @block params
  layout(std140) uniform Uniforms {
    int samples;
    int distribution; // enum
    int floatTexture; // 0: byte, 1: float
    float intensity;
  } params;

  in vec2 uv;
  out vec4 fragColor;
  void main() {

    vec3 color = LUT(
      uv.x, // NdotV
      uv.y, // roughness
      params.samples,
      params.distribution
    );

    if(params.floatTexture == 0) {
      color/= params.intensity;
      color = clamp(color, 0.0f, 1.0f);
    }

    fragColor = vec4(color, 1.0) ;
  }
`
