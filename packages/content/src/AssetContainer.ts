import { MaterialOptions, MeshOptions, TextureOptions } from '@gglib/graphics'
import { AnimationData, NodeData, SceneData, SkinData } from '@gglib/model'

/**
 * An asset container holding loaded data ready to create graphics resources.
 *
 * @remarks
 * Modeled after glTF 2.0 asset container.
 */
export interface AssetContainer {
  /**
   * The url where this asset was loaded from.
   */
  source: string | Blob

  name?: string


  meshes?: MeshOptions[]

  textures?: TextureOptions[]

  materials?: MaterialOptions[]

  animations?: AnimationData[]

  scene?: number

  scenes?: SceneData[]

  nodes?: NodeData[]

  skins?: SkinData[]
}
