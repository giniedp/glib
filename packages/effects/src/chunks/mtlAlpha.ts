import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * @public
 */
export interface MtlAlphaDefs {
  /**
   * Enables the alpha uniform
   */
  ALPHA?: any
  /**
   * Enables alpha clipping
   */
  ALPHA_CLIP?: any
}

/**
 * Adds alpha clip functionality to a shader
 *
 * @public
 * @remarks
 * Uses the following defines
 *
 *  - ALPHA
 *  - ALPHA_CLIP
 */
export const MTL_ALPHA: ShaderChunkSet = Object.freeze({
  uniforms: glsl`
    #ifdef ALPHA
    // @binding Alpha
    // @widget  range(0, 1)
    // @default 1
    uniform float uAlpha;
    #endif
    #ifdef ALPHA_CLIP
    // @binding AlphaClip
    // @widget  range(0, 1)
    // @default 0.5
    uniform float uAlphaClip;
    #endif
  `,
  fs_surface_after: glsl`
    #ifdef ALPHA
    surface.Diffuse.a *= uAlpha;
    #endif
    #ifdef ALPHA_CLIP
    if ((surface.Diffuse.a - uAlphaClip) <= 0.0) discard;
    #endif
  `,
})
