import { glsl, ShaderChunkSet } from '@gglib/graphics'

/**
 * @public
 */
export interface VColorDefs {
  /**
   * Enables the vertex color attribute with index 0
   */
  V_COLOR?: boolean
  /**
   * Enables the vertex color attribute with index 1
   */
  V_COLOR1?: boolean
  /**
   * Enables the vertex color attribute with index 2
   */
  V_COLOR2?: boolean
}
/**
 * @public
 */

export const FXC_V_COLOR: ShaderChunkSet<VColorDefs> = Object.freeze({
  attributes: glsl`
    #ifdef V_COLOR
    // @binding color
    // @remarks The vertex color
    attribute vec3 aColor;
    #endif
    #ifdef V_COLOR1
    // @binding color
    // @remarks The vertex color
    attribute vec3 aColor1;
    #endif
    #ifdef V_COLOR2
    // @binding color2
    // @remarks The second vertex color
    attribute vec3 aColor2;
    #endif
  `,
  varyings: glsl`
    #ifdef V_COLOR
    varying vec3 vColor;
    #endif
    #ifdef V_COLOR1
    varying vec3 vColor1;
    #endif
    #ifdef V_COLOR2
    varying vec3 vColor2;
    #endif
  `,
  vs_texture: glsl`
    #ifdef V_COLOR
    vColor = aColor;
    #endif
    #ifdef V_COLOR1
    vColor1 = aColor1;
    #endif
    #ifdef V_COLOR2
    vColor2 = aColor2;
    #endif
  `,
})
