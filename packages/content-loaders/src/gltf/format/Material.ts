import { Property, RootProperty } from './common'
import { TextureInfo } from './TextureInfo'

/**
 * A set of parameter values that are used to define the metallic-roughness material model
 * from Physically-Based Rendering (PBR) methodology.
 */
export interface PbrMaterialMetallicRoughness extends Property {
  /**
   * The material's base color factor.
   *
   * @remarks
   * The RGBA components of the base color of the material.
   * The fourth component (A) is the alpha coverage of the material.
   * The `alphaMode` property specifies how alpha is interpreted.
   * These values are linear. If a baseColorTexture is specified, this value is multiplied with the texel values.
   */
  baseColorFactor?: number[]

  /**
   * The base color texture.
   *
   * @remarks
   * The base color texture. This texture contains RGB(A) components in sRGB color space.
   * The first three components (RGB) specify the base color of the material.
   * If the fourth component (A) is present, it represents the alpha coverage of the material.
   * Otherwise, an alpha of 1.0 is assumed. The `alphaMode` property specifies how alpha is interpreted.
   * The stored texels must not be premultiplied.
   */
  baseColorTexture?: TextureInfo

  /**
   * The metalness of the material.
   *
   * @remarks
   * The metalness of the material. A value of 1.0 means the material is a metal.
   * A value of 0.0 means the material is a dielectric. Values in between are for blending between metals
   * and dielectrics such as dirty metallic surfaces. This value is linear.
   * If a metallicRoughnessTexture is specified, this value is multiplied with the metallic texel values.
   */
  metallicFactor?: number

  /**
   * The roughness of the material.
   *
   * @remarks
   * The roughness of the material. A value of 1.0 means the material is completely rough.
   * A value of 0.0 means the material is completely smooth. This value is linear.
   * If a metallicRoughnessTexture is specified, this value is multiplied with the roughness texel values.
   */
  roughnessFactor?: number

  /**
   * The metallic-roughness texture.
   *
   * @remarks
   * The metallic-roughness texture. The metalness values are sampled from the B channel.
   * The roughness values are sampled from the G channel. These values are linear.
   * If other channels are present (R or A), they are ignored for metallic-roughness calculations.
   */
  metallicRoughnessTexture?: TextureInfo
}

export interface MaterialOcclusionTextureInfo extends TextureInfo {
  /**
   * A scalar multiplier controlling the amount of occlusion applied.
   *
   * @remarks
   * A scalar multiplier controlling the amount of occlusion applied.
   * A value of 0.0 means no occlusion. A value of 1.0 means full occlusion.
   * This value affects the resulting color using the formula:
   *
   *    `occludedColor = lerp(color, color * <sampled occlusion texture value>, <occlusion strength>)`
   *
   * This value is ignored if the corresponding texture is not specified. This value is linear.
   */
  strength?: number
}

export interface NormalTextureIinfo extends TextureInfo {
  /**
   * The scalar multiplier applied to each normal vector of the normal texture.
   *
   * @remarks
   * The scalar multiplier applied to each normal vector of the texture.
   * This value scales the normal vector using the formula:
   *
   *  `scaledNormal =  normalize((normalize(<sampled normal texture value>) * 2.0 - 1.0) * vec3(<normal scale>, <normal scale>, 1.0))`.
   *
   * This value is ignored if normalTexture is not specified. This value is linear.
   */
  scale?: number
}

export interface Material extends RootProperty {
  /**
   * A set of parameter values that are used to define the metallic-roughness material model from
   * Physically-Based Rendering (PBR) methodology.
   * When not specified, all the default values of `pbrMetallicRoughness` apply.
   */
  pbrMetallicRoughness?: PbrMaterialMetallicRoughness

  /**
   * The normal map texture.
   *
   * @remarks
   * A tangent space normal map. The texture contains RGB components in linear space.
   * Each texel represents the XYZ components of a normal vector in tangent space.
   * Red [0 to 255] maps to X [-1 to 1].
   * Green [0 to 255] maps to Y [-1 to 1].
   * Blue [128 to 255] maps to Z [1/255 to 1].
   * The normal vectors use OpenGL conventions where +X is right and +Y is up. +Z points toward the viewer.
   * In GLSL, this vector would be unpacked like so:
   *
   *  `float3 normalVector = tex2D(<sampled normal map texture value>, texCoord) * 2 - 1`
   *
   * Client implementations should normalize the normal vectors before using them in lighting equations.
   */
  normalTexture?: NormalTextureIinfo

  /**
   * The occlusion map texture.
   *
   * @remarks
   * The occlusion map texture. The occlusion values are sampled from the R channel.
   * Higher values indicate areas that should receive full indirect lighting and lower
   * values indicate no indirect lighting. These values are linear. If other channels are present (GBA),
   * they are ignored for occlusion calculations.
   */
  occlusionTexture?: MaterialOcclusionTextureInfo

  /**
   * The emissive map texture.
   *
   * @remarks
   * The emissive map controls the color and intensity of the light being emitted by the material.
   * This texture contains RGB components in sRGB color space. If a fourth component (A) is present, it is ignored.
   */
  emissiveTexture?: TextureInfo

  /**
   * The emissive color of the material.
   *
   * @remarks
   * The RGB components of the emissive color of the material. These values are linear.
   * If an emissiveTexture is specified, this value is multiplied with the texel values.
   */
  emissiveFactor?: number[]

  /**
   * The alpha rendering mode of the material.
   *
   * @remarks
   * The material's alpha rendering mode enumeration specifying the interpretation of the alpha value of the main factor and texture.
   */
  alphaMode?: 'OPAQUE' | 'MASK' | 'BLEND'

  /**
   * The alpha cutoff value of the material.
   *
   * @remarks
   * Specifies the cutoff threshold when in `MASK` mode. If the alpha value is greater than or equal to this
   * value then it is rendered as fully opaque, otherwise, it is rendered as fully transparent.
   * A value greater than 1.0 will render the entire material as fully transparent. This value is ignored for other modes.
   */
  alphaCutoff?: number

  /**
   * Specifies whether the material is double sided.
   *
   * @remarks
   * Specifies whether the material is double sided. When this value is false, back-face culling is enabled.
   * When this value is true, back-face culling is disabled and double sided lighting is enabled.
   * The back-face must have its normals reversed before the lighting equation is evaluated.
   */
  doubleSided?: boolean
}

/**
 * https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_unlit
 */
export const KHR_materials_unlit = 'KHR_materials_unlit'

/**
 * https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_materials_pbrSpecularGlossiness/README.md
 */
export const KHR_materials_pbrSpecularGlossiness = 'KHR_materials_pbrSpecularGlossiness'

export interface PbrMaterialSpecularGlossiness extends Property {
  /**
   * The reflected diffuse factor of the material.
   *
   * @remarks
   * he RGBA components of the reflected diffuse color of the material.
   * Metals have a diffuse value of `[0.0, 0.0, 0.0]`. The fourth component (A)
   * is the alpha coverage of the material. The `alphaMode` property specifies how alpha is interpreted.
   * The values are linear.
   */
  diffuseFactor?: number[]

  /**
   * The diffuse texture.
   *
   * @remarks
   * The diffuse texture. This texture contains RGB(A) components of the reflected diffuse color of the
   * material in sRGB color space. If the fourth component (A) is present, it represents the alpha coverage of the material.
   * Otherwise, an alpha of 1.0 is assumed. The `alphaMode` property specifies how alpha is interpreted.
   * The stored texels must not be premultiplied.
   */
  diffuseTexture?: TextureInfo

  /**
   * The specular RGB color of the material.
   *
   * @remarks
   * The specular RGB color of the material. This value is linear.
   */
  specularFactor?: number[]

  /**
   * The glossiness or smoothness of the material.
   *
   * @remarks
   * The glossiness or smoothness of the material. A value of 1.0 means the material has full glossiness or
   * is perfectly smooth. A value of 0.0 means the material has no glossiness or is completely rough.
   * This value is linear.
   */
  glossinessFactor?: number

  /**
   * The specular-glossiness texture.
   *
   * @remarks
   * he specular-glossiness texture is RGBA texture, containing the specular color of the
   * material (RGB components) and its glossiness (A component). The values are in sRGB space.
   */
  specularGlossinessTexture?: TextureInfo
}

/**
 * https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_materials_clearcoat/README.md
 */
export const KHR_materials_clearcoat = 'KHR_materials_clearcoat'

export interface MaterialClearcoat extends Property {
  /**
   * The clearcoat layer intensity.
   */
  clearcoatFactor?: number

  /**
   * The clearcoat layer intensity texture.
   */
  clearcoatTexture?: TextureInfo

  /**
   * The clearcoat layer roughness.
   */
  clearcoatRoughnessFactor?: number

  /**
   * The specular RGB color of the material.
   *
   * @remarks
   * The specular RGB color of the material. This value is linear.
   */
  specularFactor?: number[]

  /**
   * The clearcoat layer roughness texture.
   */
  clearcoatRoughnessTexture?: TextureInfo

  /**
   * The clearcoat normal map texture.
   */
  clearcoatNormalTexture?: NormalTextureIinfo
}
