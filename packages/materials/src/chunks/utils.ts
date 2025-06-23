import { glsl, ShaderChunkSet } from '@gglib/graphics'

/**
 * @public
 */
export const UTILS: ShaderChunkSet = Object.freeze({
  defines: glsl`
    const float PI = 3.1415926535897932384626433832795;
    const float TWO_PI = 6.283185307179586;
    const float HALF_PI = 1.5707963267948966;
    const float RECIPROCAL_PI = 0.3183098861837907;
  `,
  functions_before: glsl`
    highp vec3 fresnelSchlick(vec3 R, float dotLH) {
      return R + (1.0 - R) * pow(1.0 - dotLH, 5.0);
    }

    highp vec3 fresnelSchlickf90(in vec3 f0, vec3 f90, float u) {
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

    const float LinearEncodePowerApprox = 2.2;
    const float GammaEncodePowerApprox = 1.0/LinearEncodePowerApprox;
    float roughnessToPower(float roughness) {
      return 2.0 / ( roughness * roughness + 0.0001 ) - 2.0;
    }

    float toLinearSpace(float color) {
        return pow(color, LinearEncodePowerApprox);
    }
    vec3 toLinearSpace(vec3 color) {
        return pow(color, vec3(LinearEncodePowerApprox));
    }
    vec4 toLinearSpace(vec4 color) {
        return vec4(pow(color.rgb, vec3(LinearEncodePowerApprox)), color.a);
    }
    float toGammaSpace(float color) {
        return pow(color, GammaEncodePowerApprox);
    }
    vec3 toGammaSpace(vec3 color) {
        return pow(color, vec3(GammaEncodePowerApprox));
    }
    vec4 toGammaSpace(vec4 color) {
        return vec4(pow(color.rgb, vec3(GammaEncodePowerApprox)), color.a);
    }
    // https://seblagarde.wordpress.com/wp-content/uploads/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf
    //
    // vec3 approximationSRgbToLinear (in vec3 sRGBCol )
    // {
    //   return pow (sRGBCol, 2.2) ;
    // }

    // vec3 approximationLinearToSRGB (in vec3 linearCol )
    // {
    //   return pow (linearCol, 1 / 2.2) ;
    // }

    // vec3 accurateSRGBToLinear (in vec3 sRGBCol )
    // {
    //   vec3 linearRGBLo = sRGBCol / 12.92;
    //   vec3 linearRGBHi = pow (( sRGBCol + 0.055) / 1.055 , 2.4) ;
    //   vec3 linearRGB = ( sRGBCol <= 0.04045) ? linearRGBLo : linearRGBHi ;
    //   return linearRGB;
    // }

    // vec3 accurateLinearToSRGB (in vec3 linearCol )
    // {
    //   vec3 sRGBLo = linearCol * 12.92;
    //   vec3 sRGBHi = ( pow( abs ( linearCol ) , 1.0/2.4) * 1.055) - 0.055;
    //   vec3 sRGB = ( linearCol <= 0.0031308) ? sRGBLo : sRGBHi ;
    //   return sRGB;
    // }
  `,
})
