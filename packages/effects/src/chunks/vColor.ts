import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * @public
 */
export interface VColorDefs {
  /**
   * Enables the first vertex color attribute
   */
  V_COLOR1?: boolean
  /**
   * Enables a second vertex color attribute
   */
  V_COLOR2?: boolean
}
/**
 * @public
 */

export const FXC_V_COLOR: ShaderChunkSet<VColorDefs> = Object.freeze({
  attributes: glsl`
    #ifdef V_COLOR1
    // @binding color
    // @remarks The vertex color
    attribute vec3 aColor;
    #endif
    #ifdef V_COLOR2
    // @binding color2
    // @remarks The second vertex color
    attribute vec3 aColor2;
    #endif
  `,
  varyings: glsl`
    #ifdef V_COLOR1
    varying vec3 vColor;
    #endif
    #ifdef V_COLOR2
    varying vec3 vColor2;
    #endif
  `,
  vs_texture: glsl`
    #ifdef V_COLOR1
    vColor = aColor;
    #endif
    #ifdef V_COLOR2
    vColor2 = aColor2;
    #endif
  `,
})
