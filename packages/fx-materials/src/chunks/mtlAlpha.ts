import { glsl, ShaderChunkSet } from '@gglib/graphics'
/**
 * @public
 */
export interface MtlAlphaDefs {
  /**
   * Enables uniform alpha value
   *
   * @remarks
   * Adds a `uniform float uAlpha` (bound as `Alpha`) that is used as alpha value.
   * If an alpha map is used, then both are multiplied.
   */
  ALPHA?: boolean
  /**
   * Enables premultiplied alpha
   *
   * @remarks
   * multiplies the final color value with alpha
   */
  ALPHA_PREMULTIPLY?: boolean
  /**
   * Enables alpha texture
   *
   * @remarks
   * Adds a `uniform sampler2D uAlphaMap` (bound as `AlphaMap`) that is used as alpha value.
   * If uniform alpha value is used, then both are multiplied.
   */
  ALPHA_MAP?: boolean,
  /**
   * Allows to override the texture coordinates. Default is `vTexture.xy`.
   */
  ALPHA_MAP_UV?: string
  /**
   * Defines the texture channel which should be used for alpha value
   *
   * @remarks
   * defaults to `r`
   */
  ALPHA_MAP_CHANNEL?: string
  /**
   * Enables alpha clipping
   *
   * @remarks
   * Adds a `uniform float uAlphaClip` (bound as `AlphaClip`) that is used to discard
   * the fragment shader before the shade stage.
   */
  ALPHA_CLIP?: boolean
}

/**
 * Adds alpha clip functionality to a shader. See {@link MtlAlphaDefs}
 *
 * @public
 */
export const FXC_MTL_ALPHA: ShaderChunkSet<MtlAlphaDefs> = Object.freeze({
  defines: glsl`
    #ifdef ALPHA_MAP
      #if !defined(V_TEXTURE) && !defined(V_TEXTURE1) && !defined(V_TEXTURE2)
        #define V_TEXTURE
      #endif

      #ifndef ALPHA_MAP_UV
        #define ALPHA_MAP_UV vTexture.xy
      #endif

      #ifndef ALPHA_MAP_CHANNEL
        #define ALPHA_MAP_CHANNEL r
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

    #ifdef ALPHA_MAP_SCALE_OFFSET
    // @binding AlphaMapScaleOffset
    uniform vec4 uAlphaMapScaleOffset;
    #endif
  `,
  functions: glsl`
    #ifdef ALPHA_MAP
    vec2 getAlphaMapUV() {
      #ifdef ALPHA_MAP_SCALE_OFFSET
      return ALPHA_MAP_UV * uAlphaMapScaleOffset.xy + uAlphaMapScaleOffset.zw;
      #else
      return ALPHA_MAP_UV;
      #endif
    }
    #endif
  `,
  fs_surface_after: glsl`
    #if defined(ALPHA_MAP)
    surface.Diffuse.a = texture2D(uAlphaMap, getAlphaMapUV() + uvOffset).ALPHA_MAP_CHANNEL;
    #endif

    #ifdef ALPHA
    surface.Diffuse.a *= uAlpha;
    #endif

    #ifdef ALPHA_CLIP
    if ((surface.Diffuse.a - uAlphaClip) <= 0.0) discard;
    #endif
  `,
  fs_frag_color: glsl`
    #if defined(ALPHA_PREMULTIPLY)
    color.rgb *= surface.Diffuse.a;
    #endif
  `,
})
