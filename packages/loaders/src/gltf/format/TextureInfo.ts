import { Property } from './common'

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
