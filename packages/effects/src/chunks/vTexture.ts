import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * @public
 */
export interface VTextureDefs {
  /**
   * Enables the first vertex texture attribute
   */
  V_TEXTURE1?: boolean
  /**
   * Enables a second vertex texture attribute
   */
  V_TEXTURE2?: boolean

  /**
   * Offsets and scales Texture 1 coordinates
   */
  V_TEXTURE1_SCALE_OFFSET?: boolean

  /**
   * Offsets and scales Texture 2 coordinates
   */
  V_TEXTURE2_SCALE_OFFSET?: boolean
}

/**
 * @public
 */
export const FXC_V_TEXTURE: ShaderChunkSet<VTextureDefs> = Object.freeze({
  attributes: glsl`
    #ifdef V_TEXTURE1
    // @binding texture
    // @remarks The vertex uv coordinates attribute
    attribute vec2 aTexture;
    #endif
    #ifdef V_TEXTURE2
    // @binding texture2
    // @remarks The second vertex uv coordinates attribute
    attribute vec2 aTexture2;
    #endif
  `,
  varyings: glsl`
    #ifdef V_TEXTURE1
    varying vec2 vTexture;
    #endif
    #ifdef V_TEXTURE2
    varying vec2 vTexture2;
    #endif
  `,
  uniforms: glsl`
    #ifdef V_TEXTURE1_SCALE_OFFSET
    // @binding TextureScaleOffset
    uniform vec4 uTexture1ScaleOffset;
    #endif
    #ifdef V_TEXTURE2_SCALE_OFFSET
    // @binding Texture2ScaleOffset
    uniform vec4 uTexture2ScaleOffset;
    #endif
  `,
  vs_texture: glsl`
    #ifdef V_TEXTURE1
    vTexture = aTexture;
    #ifdef V_TEXTURE1_SCALE_OFFSET
    vTexture = vTexture * uTexture1ScaleOffset.xy + uTexture1ScaleOffset.zw;
    #endif
    #endif

    #ifdef V_TEXTURE2
    vTexture2 = aTexture2;
    #ifdef V_TEXTURE2_SCALE_OFFSET
    vTexture2 = vTexture2 * uTexture2ScaleOffset.xy + uTexture2ScaleOffset.zw;
    #endif
    #endif
  `,
})
