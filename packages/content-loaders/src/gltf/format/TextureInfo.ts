import { Property } from './common'

/**
 * https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_texture_transform/README.md
 */
export const KHR_texture_transform = 'KHR_texture_transform'

export interface TextureTransform {
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

/**
 * Reference to a texture.
 */
export interface TextureInfo extends Property {
  /**
   * The index of the texture.
   */
  index: number

  /**
   * The set index of texture's TEXCOORD attribute used for texture coordinate mapping.
   *
   * @remark
   * This integer value is used to construct a string in the format `TEXCOORD_<set index>`
   * which is a reference to a key in mesh.primitives.attributes (e.g. A value of `0`
   * corresponds to `TEXCOORD_0`). Mesh must have corresponding texture coordinate attributes
   * for the material to be applicable to it.
   */
  texCoord?: number
}
