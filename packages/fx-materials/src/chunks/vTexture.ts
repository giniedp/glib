import { glsl, ShaderChunkSet } from '@gglib/graphics'

/**
 * @public
 */
export interface VTextureDefs {
  /**
   * Enables the default vertex texture attrubute
   */
  V_TEXTURE?: boolean
  /**
   * Enables the vertex texture attribute with index 1
   */
  V_TEXTURE1?: boolean
  /**
   * Enables the vertex texture attribute with index 2
   */
  V_TEXTURE2?: boolean

  /**
   * Offsets and scales the default Texture coordinates
   */
  V_TEXTURE_SCALE_OFFSET?: boolean
  /**
   * Offsets and scales the Texture coordinates with index 1
   */
  V_TEXTURE1_SCALE_OFFSET?: boolean
  /**
   * Offsets and scales the Texture coordinates with index 2
   */
  V_TEXTURE2_SCALE_OFFSET?: boolean
}

/**
 * @public
 */
export const FXC_V_TEXTURE: ShaderChunkSet<VTextureDefs> = Object.freeze({
  attributes: glsl`
    #ifdef V_TEXTURE
    // @binding texture
    // @remarks The default vertex texture attribute
    attribute vec2 aTexture;
    #endif
    #ifdef V_TEXTURE1
    // @binding texture1
    // @remarks The vertex texture attribute with index 1
    attribute vec2 aTexture1;
    #endif
    #ifdef V_TEXTURE2
    // @binding texture2
    // @remarks The vertex texture attribute with index 2
    attribute vec2 aTexture2;
    #endif
  `,
  varyings: glsl`
    #ifdef V_TEXTURE
    varying vec2 vTexture;
    #endif
    #ifdef V_TEXTURE1
    varying vec2 vTexture1;
    #endif
    #ifdef V_TEXTURE2
    varying vec2 vTexture2;
    #endif
  `,
  uniforms: glsl`
    #ifdef V_TEXTURE_SCALE_OFFSET
    // @binding TextureScaleOffset
    uniform vec4 uTextureScaleOffset;
    #endif
    #ifdef V_TEXTURE1_SCALE_OFFSET
    // @binding Texture1ScaleOffset
    uniform vec4 uTexture1ScaleOffset;
    #endif
    #ifdef V_TEXTURE2_SCALE_OFFSET
    // @binding Texture2ScaleOffset
    uniform vec4 uTexture2ScaleOffset;
    #endif
  `,
  vs_texture: glsl`
    #ifdef V_TEXTURE
    vTexture = aTexture;
    #ifdef V_TEXTURE_SCALE_OFFSET
    vTexture = vTexture * uTextureScaleOffset.xy + uTextureScaleOffset.zw;
    #endif
    #endif

    #ifdef V_TEXTURE1
    vTexture1 = aTexture1;
    #ifdef V_TEXTURE1_SCALE_OFFSET
    vTexture1 = vTexture1 * uTexture1ScaleOffset.xy + uTexture1ScaleOffset.zw;
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
