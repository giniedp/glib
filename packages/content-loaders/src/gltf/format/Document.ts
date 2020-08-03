import { Accessor } from './Accessor'
import { Animation } from './Animation'
import { Asset } from './Asset'
import { Buffer } from './Buffer'
import { BufferView } from './BufferView'
import { Camera } from './Camera'
import { Property } from './common'
import { Image } from './Image'
import { Material } from './Material'
import { Mesh } from './Mesh'
import { Node } from './Node'
import { Sampler } from './Sampler'
import { Scene } from './Scene'
import { Skin } from './Skin'
import { Texture } from './Texture'

export interface Document extends Property {
  /**
   * Preloaded binary chunks from .glb file
   */
  chunks?: ArrayBuffer[]

  /**
   * Metadata about the glTF asset.
   */
  asset: Asset

  /**
   * Names of glTF extensions used somewhere in this asset.
   */
  extensionsUsed: string[]

  /**
   * Names of glTF extensions required to properly load this asset.
   */
  extensionsRequired: string[]

  /**
   * An array of accessors.
   *
   * @remarks
   * An accessor is a typed view into a bufferView.
   */
  accessors: Accessor[]

  /**
   * An array of keyframe animations.
   */
  animations: Animation[]

  /**
   * An array of buffers.
   *
   * @remarks
   * A buffer points to binary geometry, animation, or skins.
   */
  buffers: Buffer[]

  /**
   * An array of bufferViews.
   *
   * @remarks
   * A bufferView is a view into a buffer generally representing a subset of the buffer.
   */
  bufferViews: BufferView[]

  /**
   * An array of cameras.
   *
   * @remarks
   * A camera defines a projection matrix.
   */
  cameras: Camera[]

  /**
   * An array of images.
   *
   * @remarks
   * An image defines data used to create a texture.
   */
  images: Image[]

  /**
   * n array of materials.
   *
   * @remarks
   * A material defines the appearance of a primitive.
   */
  materials: Material[]

  /**
   * An array of meshes.
   *
   * @remarks
   * A mesh is a set of primitives to be rendered.
   */
  meshes: Mesh[]

  /**
   * An array of nodes.
   */
  nodes: Node[]

  /**
   * An array of samplers.
   *
   * @remarks
   * A sampler contains properties for texture filtering and wrapping modes.
   */
  samplers: Sampler[]

  /**
   * The index of the default scene.
   */
  scene: number

  /**
   * An array of scenes.
   */
  scenes: Scene[]

  /**
   * An array of skins.
   *
   * @remarks
   * A skin is defined by joints and matrices.
   */
  skins: Skin[]

  /**
   * An array of textures.
   */
  textures: Texture[]
}
