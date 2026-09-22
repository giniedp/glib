import { AssetContainer, AssetLoader, ContentLoader, LoadContext, TextureAssetContainer } from '@gglib/content'
import { AcquireTextureOptions, TextureSource } from '@gglib/graphics'
import { readHDR } from './format'

export class Loader implements AssetLoader {
  public static extensions = ['.hdr']
  public static mimeTypes = ['image/hdr']
  public static create = () => new Loader()
  public static register(registry = ContentLoader.loaders) {
    registry.register(Loader)
  }

  public async load(url: string, context: LoadContext): Promise<AssetContainer> {
    const response = await context.content.fetch(url, {
      responseType: 'arraybuffer',
    })
    const hdr = readHDR(response.body)
    const options: AcquireTextureOptions = {
      key: url,
      name: url,
      type: '2d',
      format: 'rgba32float',
      generateMipmap: true,
      width: hdr.width,
      height: hdr.height,
      source: new TextureSource({
        levels: [[hdr.float32()]],
        width: hdr.width,
        height: hdr.height,
      }),
    }

    return new TextureAssetContainer([options])
  }
}
