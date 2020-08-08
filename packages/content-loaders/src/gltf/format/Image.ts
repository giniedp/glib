import { GLTFRootProperty } from './common'

/**
 * Image data used to create a texture. Image can be referenced by URI or `bufferView` index.
 * `mimeType` is required in the latter case.
 */
export interface GLTFImage extends GLTFRootProperty {
  /**
   * The uri of the image.
   *
   * @remarks
   * The uri of the image.  Relative paths are relative to the .gltf file.  Instead of referencing an external file,
   * the uri can also be a data-uri. The image format must be jpg or png.
   */
  uri?: string

  /**
   * The image's MIME type. Required if `bufferView` is defined.
   */
  mimeType?: 'image/jpeg' | 'image/png' | 'image/vnd.radiance' | 'image/ktx2'

  /**
   * The index of the bufferView that contains the image. Use this instead of the image's uri property.
   */
  bufferView?: number
}
