import { glsl, ShaderChunkSet } from '@gglib/graphics'

/**
 * @public
 */
export interface GammaDefs {
  /**
   * Enables gamma correction
   */
  GAMMA_CORRECTION?: boolean
  /**
   * The gamma constant
   *
   * @remarks
   * defaults to `2.2`
   */
  GAMMA?: number
}

/**
 * Enables gamma correction on a shader. See {@link GammaDefs}
 * @public
 */
export const FXC_GAMMA: ShaderChunkSet<GammaDefs> = Object.freeze({
  defines: glsl`
    #ifndef GAMMA
    #define GAMMA 2.2
    #endif
    const float INV_GAMMA = 1.0 / GAMMA;
  `,
  functions: glsl`
    vec3 linearTosRGB(vec3 color) {
      #ifdef GAMMA_CORRECTION
      // see http://chilliant.blogspot.com/2012/08/srgb-approximations-for-hlsl.html
      return pow(color, vec3(INV_GAMMA));
      #endif
      return color;
    }

    // sRGB to linear approximation
    // see http://chilliant.blogspot.com/2012/08/srgb-approximations-for-hlsl.html
    vec3 sRGBToLinear(vec3 srgbIn) {
      #ifdef GAMMA_CORRECTION
      return vec3(pow(srgbIn.xyz, vec3(GAMMA)));
      #endif
      return srgbIn;
    }

    vec4 sRGBToLinear(vec4 srgbIn) {
      #ifdef GAMMA_CORRECTION
      return vec4(sRGBToLinear(srgbIn.xyz), srgbIn.w);
      #endif
      return srgbIn;
    }
  `,
  fs_shade_before: glsl`
    #ifdef GAMMA_CORRECTION
    surface.Diffuse.rgb = pow(surface.Diffuse.rgb, vec3(GAMMA));
    surface.Specular.rgb = pow(surface.Specular.rgb, vec3(GAMMA));
    #endif
  `,
  fs_post_before: glsl`
    #ifdef GAMMA_CORRECTION
    color.rgb = pow(color.rgb, vec3(1.0/GAMMA));
    #endif
  `,
})
