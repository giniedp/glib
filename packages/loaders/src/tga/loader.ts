import { AssetContainer, AssetLoader, ContentLoader, LoaderContext, TextureAssetContainer } from '@gglib/content'
import { AcquireTextureOptions, createTextureSource } from '@gglib/graphics'
import { File } from './format'

export class Loader implements AssetLoader {
  public static extensions = ['.tga']
  public static mimeTypes = ['image/x-tga']
  public static create = () => new Loader()
  public static register(registry = ContentLoader.loaders) {
    registry.register(Loader)
  }

  public async load(url: string, context: LoaderContext): Promise<AssetContainer> {
    const response = await context.content.fetch(url, {
      responseType: 'arraybuffer',
    })
    const options = new File(response.body).getTextureOptions()
    const texture: AcquireTextureOptions = {
      key: url,
      ...options,
      source: createTextureSource(options.source, {
        width: options.width,
        height: options.height,
        format: options.format,
      }),
    }

    return new TextureAssetContainer([texture])
  }
}
