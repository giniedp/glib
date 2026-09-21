import { TextureOptions } from '@gglib/graphics'
import { AssetType } from './AssetType'
import { LoadContext } from './ContentLoader'

export interface AssetContainer {
  count(asset: AssetType<any, any>): number
  load<T>(asset: AssetType<T, any>, index: number, context: LoadContext): Promise<T>
}

/**
 * An asset container that wraps one or more textures. This is a common case for texture only loaders, and allows them to implement
 * the AssetLoader interface without having to create a custom container class for each loader.
 */
export class TextureAssetContainer implements AssetContainer {
  private readonly textures: TextureOptions[]

  public constructor(textures: TextureOptions[]) {
    this.textures = textures
  }

  public count(asset: AssetType<any, any>): number {
    if (asset === AssetType.Texture) {
      return this.textures.length
    }
    return 0
  }

  public async load<T>(asset: AssetType<T, any>, index: number, context: LoadContext): Promise<T>
  public async load(asset: AssetType<any, any>, index: number, context: LoadContext): Promise<any> {
    if (asset !== AssetType.Texture) {
      throw new Error(`AssetType not supported by this container: ${asset}`)
    }
    const texture = this.textures[index]
    if (!texture) {
      throw new Error(`Texture index ${index} out of bounds for container with 1 texture`)
    }
    return texture
  }
}
