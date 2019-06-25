import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * @public
 */
export interface GammaDefs {
  /**
   * Enables gamma correction
   */
  GAMMA_CORRECTION?: any
  /**
   * The gamma constant
   *
   * @remarks
   * defaults to `2.2`
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
export const GAMMA: ShaderChunkSet = Object.freeze({
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
