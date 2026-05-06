import { AssetContainer, AssetLoader, ContentLoader, LoaderContext, TextureAssetContainer } from '@gglib/content'
import { AcquireTextureOptions, ArrayBufferViewSource } from '@gglib/graphics'
import { readHDR } from './format'

export class Loader implements AssetLoader {
  public static extensions = ['.hdr']
  public static mimeTypes = ['image/hdr']
  public static create = () => new Loader()
  public static register(registry = ContentLoader.loaders) {
    registry.register(Loader)
  }

  public async load(url: string, context: LoaderContext): Promise<AssetContainer> {
    const response = await context.content.fetch(url, {
      responseType: 'arraybuffer',
    })
    const hdr = readHDR(response.body)
    const data = hdr.float32()
    const options: AcquireTextureOptions = {
      key: url,
      name: url,
      format: 'RGBA32_FLOAT',
      source: new ArrayBufferViewSource([[data]], hdr.width, hdr.height),
      width: hdr.width,
      height: hdr.height,
      type: 'Texture2D',
      generateMipmap: true,
    }

    return new TextureAssetContainer([options])
  }
}
