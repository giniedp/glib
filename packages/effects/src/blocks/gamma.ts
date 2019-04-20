import { glsl } from '../glsl'

export interface GammaDefs {
  /**
   *
   */
  GAMMA_CORRECTION?: any
  /**
   *
   */
  GAMMA?: any
}

/**
 * Enables gamma correction on a shader
 *
 * @remarks
 * Uses the following defines
 *
 *  - `GAMMA_CORRECTION` - enables gamma correction
 *  - `GAMMA` - defaults to 2.2
 */
export const GAMMA = Object.freeze({
  defines: glsl`
    #ifndef GAMMA
    #define GAMMA 2.2
    #endif
  `,
  fs_shade_before: glsl`
    #ifdef GAMMA_CORRECTION
    surface.Diffuse.rgb = pow(surface.Diffuse.rgb, vec3(GAMMA));
    surface.Specular.rgb = pow(surface.Specular.rgb, vec3(GAMMA));
    #endif
  `,
  fs_shade_after: glsl`
    #ifdef GAMMA_CORRECTION
    color.rgb = pow(color.rgb, vec3(1.0/GAMMA));
    #endif
  `,
})
