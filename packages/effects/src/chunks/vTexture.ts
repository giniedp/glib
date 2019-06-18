import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

export interface VTextureDefs {
  /**
   * Enables the first vertex texture attribute
   */
  V_TEXTURE1?: any
  /**
   * Enables a second vertex texture attribute
   */
  V_TEXTURE2?: any

  /**
   * Offsets and scales Texture 1 coordinates
   */
  V_TEXTURE1_OFFSET_SCALE?: any

  /**
   * Offsets and scales Texture 2 coordinates
   */
  V_TEXTURE2_OFFSET_SCALE?: any
}

export const V_TEXTURE: ShaderChunkSet = Object.freeze({
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
    #ifdef V_TEXTURE1_OFFSET_SCALE
    // @binding TextureOffsetScale
    uniform vec4 uTexture1OffsetScale;
    #endif
    #ifdef V_TEXTURE2_OFFSET_SCALE
    // @binding Texture2OffsetScale
    uniform vec4 uTexture2OffsetScale;
    #endif
  `,
  vs_texture: glsl`
    #ifdef V_TEXTURE1
    vTexture = aTexture;
    #ifdef V_TEXTURE1_OFFSET_SCALE
    vTexture = uTexture1OffsetScale.xy + vTexture * uTexture1OffsetScale.zw;
    #endif
    #endif

    #ifdef V_TEXTURE2
    vTexture2 = aTexture2;
    #ifdef V_TEXTURE2_OFFSET_SCALE
    vTexture2 = uTexture2OffsetScale.xy + vTexture2 * uTexture2OffsetScale.zw;
    #endif
    #endif
  `,
})
