import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * @public
 */
export const UTILS: ShaderChunkSet = Object.freeze({
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

    mat3 transposeMat3(mat3 m) {
      vec3 v0 = m[0];
      vec3 v1 = m[1];
      vec3 v2 = m[2];

      return mat3(
        vec3(v0.x, v1.x, v2.x),
        vec3(v0.y, v1.y, v2.y),
        vec3(v0.z, v1.z, v2.z)
      );
    }
  `,
})
