import { glsl } from '../glsl'

export const UTILS = Object.freeze({
  defines: glsl`
    #define M_PI 3.1415926535897932384626433832795
  `,
  functions_before: glsl`
    highp vec3 fresnelSchlick(vec3 R, float dotLH) {
      return R + (1.0 - R) * pow(1.0 - dotLH, 5.0);
    }

    highp vec3 fresnelSchlickf90(in vec3 f0, float f90, float u) {
      return f0 + (f90 - f0) * pow(clamp(1.0 - u, 0.0, 1.0), 5.0);
    }
  `,
})
