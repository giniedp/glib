import { GLTFRootProperty } from './common'

/**
 * A buffer points to binary geometry, animation, or skins.
 */
export interface GLTFBuffer extends GLTFRootProperty {
  /**
   * The uri of the buffer.
   *
   * @remarks
   * The uri of the buffer.  Relative paths are relative to the .gltf file.
   * Instead of referencing an external file, the uri can also be a data-uri.
   */
  uri?: string

  /**
   * The length of the buffer in bytes.
   */
  byteLength: number
}
