import { GLTFAccessor } from './Accessor'
import { GLTFAnimation } from './Animation'
import { GLTFAsset } from './Asset'
import { GLTFBuffer } from './Buffer'
import { GLTFBufferView } from './BufferView'
import { GLTFCamera } from './Camera'
import { GLTFProperty } from './common'
import { GLTFImage } from './Image'
import { GLTFMaterial } from './Material'
import { GLTFMesh } from './Mesh'
import { GLTFNode } from './Node'
import { GLTFSampler } from './Sampler'
import { GLTFScene } from './Scene'
import { GLTFSkin } from './Skin'
import { GLTFTexture } from './Texture'

export interface GLTFDocument extends GLTFProperty {
  /**
   * Preloaded binary chunks from .glb file
   */
  chunks?: ArrayBuffer[]

  /**
   * Metadata about the glTF asset.
   */
  asset: GLTFAsset

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
  accessors: GLTFAccessor[]

  /**
   * An array of keyframe animations.
   */
  animations: GLTFAnimation[]

  /**
   * An array of buffers.
   *
   * @remarks
   * A buffer points to binary geometry, animation, or skins.
   */
  buffers: GLTFBuffer[]

  /**
   * An array of bufferViews.
   *
   * @remarks
   * A bufferView is a view into a buffer generally representing a subset of the buffer.
   */
  bufferViews: GLTFBufferView[]

  /**
   * An array of cameras.
   *
   * @remarks
   * A camera defines a projection matrix.
   */
  cameras: GLTFCamera[]

  /**
   * An array of images.
   *
   * @remarks
   * An image defines data used to create a texture.
   */
  images: GLTFImage[]

  /**
   * n array of materials.
   *
   * @remarks
   * A material defines the appearance of a primitive.
   */
  materials: GLTFMaterial[]

  /**
   * An array of meshes.
   *
   * @remarks
   * A mesh is a set of primitives to be rendered.
   */
  meshes: GLTFMesh[]

  /**
   * An array of nodes.
   */
  nodes: GLTFNode[]

  /**
   * An array of samplers.
   *
   * @remarks
   * A sampler contains properties for texture filtering and wrapping modes.
   */
  samplers: GLTFSampler[]

  /**
   * The index of the default scene.
   */
  scene: number

  /**
   * An array of scenes.
   */
  scenes: GLTFScene[]

  /**
   * An array of skins.
   *
   * @remarks
   * A skin is defined by joints and matrices.
   */
  skins: GLTFSkin[]

  /**
   * An array of textures.
   */
  textures: GLTFTexture[]
}
