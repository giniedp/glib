import { ShaderChunkSet } from '@gglib/graphics'
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
   * Enables alpha clipping
   *
   * @remarks
   * Adds a `uniform float uAlphaClip` (bound as `AlphaClip`) that is used to discard
   * the fragment shader before the shade stage.
   */
  ALPHA_CLIP?: boolean

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
  ALPHA_MAP?: boolean

  /**
   * Allows to override the texture coordinates. Default is `vTexture.xy`.
   */
  ALPHA_MAP_UV?: string

  /**
   * Allows to scale and offset the texture
   *
   * @remarks
   * Adds a `uniform vec4 uAlphaMapScaleOffset` that is used to transform the texture coordinates.
   * This is done in pixel shader for the AlphaMap only.
   */
  ALPHA_MAP_SCALE_OFFSET?: boolean

  /**
   * Allows to transform the texture coordinates
   *
   * @remarks
   * Adds a `uniform mat3 uAlphaMapTransform` that is used to transform the texture coordinates.
   * This is done in pixel shader for the AlphaMap only.
   */
  ALPHA_MAP_TRANSFORM?: boolean

  /**
   * Defines the texture channel which should be used for alpha value
   *
   * @remarks
   * defaults to `r`
   */
  ALPHA_MAP_CHANNEL?: string
}

/**
 * Adds alpha clip functionality to a shader. See {@link MtlAlphaDefs}
 *
 * @public
 */
export const MTL_ALPHA: ShaderChunkSet<MtlAlphaDefs> = {
  defines: /* glsl */ `
    #ifdef ALPHA_MAP
      #ifndef ALPHA
      #define ALPHA
      #endif

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
  uniforms: /* glsl */ `
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
    uniform sampler2D uAlphaMap;
    #endif

    #ifdef ALPHA_MAP_SCALE_OFFSET
    // @binding AlphaMapScaleOffset
    uniform vec4 uAlphaMapScaleOffset;
    #endif

    #ifdef ALPHA_MAP_TRANSFORM
    // @binding AlphaMapTransform
    uniform mat3 uAlphaMapTransform;
    #endif
  `,
  fs_functions: /* glsl */ `
    #ifdef ALPHA_MAP
    vec2 getAlphaMapUV() {
      vec2 result = ALPHA_MAP_UV;

      #ifdef ALPHA_MAP_SCALE_OFFSET
      result = result * uAlphaMapScaleOffset.xy + uAlphaMapScaleOffset.zw;
      #endif

      #ifdef ALPHA_MAP_TRANSFORM
      result = (uAlphaMapTransform * vec3(result, 1.0)).xy;
      #endif

      return result;
    }
    #endif

    void applyAlpha(inout SurfaceParams surface, in vec2 uvOffset) {
      #if defined(ALPHA_MAP)
      surface.BaseColor.a = texture2D(uAlphaMap, getAlphaMapUV() + uvOffset).ALPHA_MAP_CHANNEL;
      #endif

      #ifdef ALPHA
      surface.BaseColor.a *= uAlpha;
      #endif

      #ifdef ALPHA_CLIP
      if ((surface.BaseColor.a - uAlphaClip) < 0.0) {
        discard;
      }
      surface.BaseColor.a = 1.0;
      #endif
    }
  `,

  fs_surface_after: /* glsl */ `
    applyAlpha(surface, uvOffset);
  `,

  fs_frag_color: /* glsl */ `
    #if defined(ALPHA_PREMULTIPLY)
    color.rgb *= surface.BaseColor.a;
    #endif
  `,
}
