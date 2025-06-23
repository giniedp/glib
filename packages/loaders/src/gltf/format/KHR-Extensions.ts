import type { Property } from './common'
import type { NormalTextureIinfo } from './Material'
import type { TextureInfo } from './TextureInfo'

export function getKhrExtension(property: Property, name: typeof KHR_materials_anisotropy): KHR_materials_anisotropy
export function getKhrExtension(property: Property, name: typeof KHR_materials_clearcoat): KHR_materials_clearcoat
export function getKhrExtension(property: Property, name: typeof KHR_materials_diffuse_transmission): KHR_materials_diffuse_transmission
export function getKhrExtension(property: Property, name: typeof KHR_materials_dispersion): KHR_materials_dispersion
export function getKhrExtension(property: Property, name: typeof KHR_materials_emissive_strength): KHR_materials_emissive_strength
export function getKhrExtension(property: Property, name: typeof KHR_materials_ior): KHR_materials_ior
export function getKhrExtension(property: Property, name: typeof KHR_materials_iridescence): KHR_materials_iridescence
export function getKhrExtension(property: Property, name: typeof KHR_materials_sheen): KHR_materials_sheen
export function getKhrExtension(property: Property, name: typeof KHR_materials_specular): KHR_materials_specular
export function getKhrExtension(property: Property, name: typeof KHR_materials_transmission): KHR_materials_transmission
export function getKhrExtension(property: Property, name: typeof KHR_materials_unlit): KHR_materials_unlit
export function getKhrExtension(property: Property, name: typeof KHR_materials_variants): KHR_materials_variants
export function getKhrExtension(property: Property, name: typeof KHR_materials_volume): KHR_materials_volume
export function getKhrExtension(property: Property, name: typeof KHR_mesh_quantization): KHR_mesh_quantization
export function getKhrExtension(property: Property, name: typeof KHR_texture_basisu): KHR_texture_basisu
export function getKhrExtension(property: Property, name: typeof KHR_texture_transform): KHR_texture_transform
export function getKhrExtension(property: Property, name: typeof KHR_materials_pbrSpecularGlossiness): KHR_materials_pbrSpecularGlossiness
export function getKhrExtension<T>(property: Property, name: string): T {
  if (property?.extensions && property.extensions[name]) {
    return property.extensions[name] as T
  }
  return null
}

export const KHR_materials_anisotropy = 'KHR_materials_anisotropy'

/**
 * @see https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_anisotropy/README.md
 */
export interface KHR_materials_anisotropy {
  /**
   * The anisotropy strength. When the anisotropy texture is present, this value is multiplied by the texture's blue channel.
   * @remarks
   * - default: 0
   */
  anisotropyStrength?: number

  /**
   * The rotation of the anisotropy in tangent, bitangent space, measured in radians counter-clockwise from the tangent.
   * When the anisotropy texture is present, this value provides additional rotation to the vectors in the texture.
   *
   * @remarks
   * - default: 0
   */
  anisotropyRotation?: number

  /**
   * The anisotropy texture. Red and green channels represent the anisotropy direction in [−1;1] tangent, bitangent space
   * to be rotated by the anisotropy rotation. The blue channel contains strength as  [0;1] to be multiplied by the anisotropy strength.
   */
  anisotropyTexture?: TextureInfo
}

export const KHR_materials_clearcoat = 'KHR_materials_clearcoat'

/**
 * @see https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_clearcoat/README.md
 */
export interface KHR_materials_clearcoat {
  /**
   * The clearcoat layer intensity.
   * @remarks
   * - default: 0
   */
  clearcoatFactor?: number
  /**
   * The clearcoat layer intensity texture.
   */
  clearcoatTexture?: TextureInfo
  /**
   * The clearcoat layer roughness.
   * @remarks
   * - default: 0
   */
  clearcoatRoughnessFactor?: number
  /**
   * The clearcoat layer roughness texture.
   */
  clearcoatRoughnessTexture?: TextureInfo
  /**
   * The clearcoat normal map texture.
   */
  clearcoatNormalTexture?: NormalTextureIinfo
}

export const KHR_materials_diffuse_transmission = 'KHR_materials_diffuse_transmission'

/**
 * @see https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_diffuse_transmission/README.md
 */
export interface KHR_materials_diffuse_transmission {
  /**
   * The percentage of non-specularly reflected light that is diffusely transmitted through the surface.
   */
  diffuseTransmissionFactor?: number

  /**
   * A texture that defines the percentage of non-specularly reflected light that is diffusely transmitted through the surface.
   * Stored in the alpha (A) channel. Will be multiplied by the diffuseTransmissionFactor.
   */
  diffuseTransmissionTexture?: TextureInfo
  /**
   * The color that modulates the transmitted light.
   *
   * @remarks
   * - default: [1.0, 1.0, 1.0, 1.0]
   */
  diffuseTransmissionColorFactor?: number[]
  /**
   * A texture that defines the color that modulates the diffusely transmitted light, stored in the RGB channels and encoded in sRGB.
   * This texture will be multiplied by diffuseTransmissionColorFactor.
   */
  diffuseTransmissionColorTexture?: TextureInfo
}

export const KHR_materials_dispersion = 'KHR_materials_dispersion'

/**
 * @see https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_dispersion/README.md
 */
export interface KHR_materials_dispersion {
  /**
   * The strength of the dispersion effect, specified as 20/Abbe number.
   */
  dispersion?: number
}

export const KHR_materials_emissive_strength = 'KHR_materials_emissive_strength'

/**
 * @see https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_emissive_strength/README.md
 */
export interface KHR_materials_emissive_strength {
  /**
   * The strength adjustment to be multiplied with the material's emissive value.
   *
   * @remarks
   * - default: 1.0
   */
  emissiveStrength?: number
}

export const KHR_materials_ior = 'KHR_materials_ior'

/**
 * @see https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_ior/README.md
 */
export interface KHR_materials_ior {
  /**
   * The index of refraction.
   *
   * @remarks
   * - default: 1.5
   */
  ior?: number
}

export const KHR_materials_iridescence = 'KHR_materials_iridescence'

/**
 * @see https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_iridescence/README.md
 */
export interface KHR_materials_iridescence {
  /**
   * The iridescence intensity factor.
   */
  iridescenceFactor?: number
  /**
   * The iridescence intensity texture.
   */
  iridescenceTexture?: TextureInfo
  /**
   * The index of refraction of the dielectric thin-film layer.
   *
   * @remarks
   * - default: 1.3
   */
  iridescenceIor?: number
  /**
   * The minimum thickness of the thin-film layer given in nanometers.
   *
   * @remarks
   * - default: 100
   */
  iridescenceThicknessMinimum?: number
  /**
   * The maximum thickness of the thin-film layer given in nanometers.
   *
   * @remarks
   * - default: 400
   */
  iridescenceThicknessMaximum?: number
  /**
   * The thickness texture of the thin-film layer.
   */
  iridescenceThicknessTexture?: TextureInfo
}

export const KHR_materials_sheen = 'KHR_materials_sheen'

export interface KHR_materials_sheen {
  /**
   * The sheen color in linear space
   */
  sheenColorFactor?: number[]

  /**
   * The sheen color (RGB).
   * The sheen color is in sRGB transfer function
   */
  sheenColorTexture?: TextureInfo

  /**
   * The sheen roughness.
   *
   * @remarks
   * - default: 0
   */
  sheenRoughnessFactor?: number

  /**
   * The sheen roughness (Alpha) texture.
   */
  sheenRoughnessTexture?: TextureInfo
}

export const KHR_materials_specular = 'KHR_materials_specular'

/**
 * @see https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_specular/README.md
 */
export interface KHR_materials_specular {
  /**
   * The strength of the specular reflection.
   *
   * @remarks
   * - default: 1.0
   */
  specularFactor?: number

  /**
   * A texture that defines the strength of the specular reflection, stored in the alpha (A) channel.
   * This will be multiplied by specularFactor.
   */
  specularTexture?: TextureInfo

  /**
   * The F0 color of the specular reflection (linear RGB).
   *
   * @remarks
   * - default: [1.0, 1.0, 1.0]
   */
  specularColorFactor?: number[]

  /**
   * A texture that defines the F0 color of the specular reflection, stored in the RGB channels and encoded in sRGB.
   * This texture will be multiplied by specularColorFactor.
   */
  specularColorTexture?: TextureInfo
}

export const KHR_materials_transmission = 'KHR_materials_transmission'

/**
 * @see https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_transmission/README.md
 */
export interface KHR_materials_transmission {
  /**
   * The base percentage of light that is transmitted through the surface.
   *
   * @remarks
   * - default: 0.0
   */
  transmissionFactor?: number

  /**
   * A texture that defines the transmission percentage of the surface, stored in the R channel.
   * This will be multiplied by transmissionFactor.
   */
  transmissionTexture?: TextureInfo
}

export const KHR_materials_unlit = 'KHR_materials_unlit'

/**
 * @see https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_unlit/README.md
 */
export interface KHR_materials_unlit {}

export const KHR_materials_variants = 'KHR_materials_variants'

export interface KHR_materials_variants {
  /**
   *
   */
  variants: Array<{ name: string }>
}

export const KHR_materials_volume = 'KHR_materials_volume'

/**
 * @see https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_volume/README.md
 */
export interface KHR_materials_volume {
  /**
   * The thickness of the volume beneath the surface. The value is given in the coordinate space of the mesh.
   * If the value is 0 the material is thin-walled. Otherwise the material is a volume boundary.
   * The doubleSided property has no effect on volume boundaries. Range is [0, +inf).
   *
   * @remarks
   * - default: 0
   */
  thicknessFactor?: number

  /**
   * A texture that defines the thickness, stored in the G channel. This will be multiplied by thicknessFactor. Range is [0, 1].
   */
  thicknessTexture?: TextureInfo

  /**
   * Density of the medium given as the average distance that light travels in the medium before interacting with a particle.
   * The value is given in world space. Range is (0, +inf).
   *
   * @remarks
   * - default: +Infinity
   */
  attenuationDistance?: number

  /**
   * The color that white light turns into due to absorption when reaching the attenuation distance.
   *
   * @remarks
   * - default: [1.0, 1.0, 1.0]
   */
  attenuationColor?: number[]
}

export const KHR_mesh_quantization = 'KHR_mesh_quantization'

/**
 * @see https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_mesh_quantization/README.md
 */
export interface KHR_mesh_quantization {}

export const KHR_texture_basisu = 'KHR_texture_basisu'

export interface KHR_texture_basisu {
  source: number
}

export const KHR_texture_transform = 'KHR_texture_transform'

/**
 * @see https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_texture_transform/README.md
 */
export interface KHR_texture_transform {
  /**
   * The offset of the UV coordinate origin as a factor of the texture dimensions.
   */
  offset?: number[]
  /**
   * Rotate the UVs by this many radians counter-clockwise around the origin.
   * This is equivalent to a similar rotation of the image clockwise.
   */
  rotation?: number
  /**]
   * The scale factor applied to the components of the UV coordinates.
   */
  scale?: number[]
  /**
   * Overrides the textureInfo texCoord value if supplied, and if this extension is supported.
   */
  texCoord?: number
}

export const KHR_materials_pbrSpecularGlossiness = 'KHR_materials_pbrSpecularGlossiness'

/**
 * @see https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Archived/KHR_materials_pbrSpecularGlossiness/README.md
 */
export interface KHR_materials_pbrSpecularGlossiness {
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
