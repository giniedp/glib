import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * @public
 */
export interface MtlAlphaDefs {
  /**
   * Enables alpha lookup from an alpha map
   */
  ALPHA_MAP?: any,
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
 *  - ALPHA_MAP
 */
export const MTL_ALPHA: ShaderChunkSet = Object.freeze({
  defines: glsl`
    #ifdef ALPHA_MAP
      #if !defined(V_TEXTURE1) && !defined(V_TEXTURE2)
        #define V_TEXTURE1
      #endif

      #ifndef ALPHA_MAP_UV
        #define ALPHA_MAP_UV vTexture.xy
      #endif
    #endif
  `,
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

    #ifdef ALPHA_MAP
    // @binding  AlphaMap
    // @filter   LinearWrap
    uniform sampler2D uAlphaMap;
    #endif

    #ifdef ALPHA_MAP_OFFSET_SCALE
    // @binding AlphaMapOffsetScale
    uniform vec4 uAlphaMapOffsetScale;
    #endif
  `,
  functions: glsl`
    #ifdef ALPHA_MAP
    vec2 getAlphaMapUV() {
      #ifdef ALPHA_MAP_OFFSET_SCALE
      return ALPHA_MAP_UV * uAlphaMapOffsetScale.zw + uAlphaMapOffsetScale.xy;
      #else
      return ALPHA_MAP_UV;
      #endif
    }
    #endif
  `,
  fs_surface_after: glsl`
    #if defined(ALPHA_MAP)
    surface.Diffuse.a = texture2D(uAlphaMap, getAlphaMapUV() + uvOffset).r;
    #endif

    #ifdef ALPHA
    surface.Diffuse.a *= uAlpha;
    #endif

    #ifdef ALPHA_CLIP
    if ((surface.Diffuse.a - uAlphaClip) <= 0.0) discard;
    #endif
  `,
})
