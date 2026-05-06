import { MaterialOptions, TextureOptions } from '@gglib/graphics'
import { ModelOptions } from '@gglib/model'
import { LoaderContext } from './ContentLoader'

export abstract class AssetContainer {
  public abstract readonly modelCount: number
  public abstract readonly materialCount: number
  public abstract readonly textureCount: number

  public abstract loadModel(index: number, context: LoaderContext): Promise<ModelOptions>

  public abstract loadMaterial(index: number, context: LoaderContext): Promise<MaterialOptions>

  public abstract loadTexture(index: number, context: LoaderContext): Promise<TextureOptions>
}

/**
 * An asset container that wraps one or more textures. This is a common case for texture only loaders, and allows them to implement
 * the AssetLoader interface without having to create a custom container class for each loader.
 */
export class TextureAssetContainer extends AssetContainer {
  private readonly textures: TextureOptions[]

  public override modelCount: number
  public override materialCount: number
  public override textureCount: number

  public constructor(textures: TextureOptions[]) {
    super()
    this.textures = textures
    this.textureCount = textures.length
    this.modelCount = 0
    this.materialCount = 0
  }

  public override async loadTexture(index: number): Promise<TextureOptions> {
    const texture = this.textures[index]
    if (!texture) {
      throw new Error(`Texture index ${index} out of bounds for container with 1 texture`)
    }
    return texture
  }

  public override loadModel(index: number, context: LoaderContext): Promise<ModelOptions> {
    throw new Error('Method not implemented.')
  }

  public override loadMaterial(index: number, context: LoaderContext): Promise<MaterialOptions> {
    throw new Error('Method not implemented.')
  }
}
