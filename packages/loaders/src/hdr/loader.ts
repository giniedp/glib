import { AssetContainer, AssetLoader, ContentLoader, LoaderContext } from '@gglib/content'
import { ArrayBufferViewSource, SamplerState, TextureOptions } from '@gglib/graphics'
import { readHDR } from './format'

export function registerLoader() {
  ContentLoader.registerLoader(Loader)
}

export class Loader implements AssetLoader {
  public static extensions = ['.hdr']
  public static mimeTypes = ['image/hdr']
  public static loader = Loader

  public async load(url: string, context: LoaderContext): Promise<AssetContainer> {
    const response = await context.content.fetch(url, {
      responseType: 'arraybuffer',
    })
    const hdr = readHDR(response.body)
    const data = hdr.float32()
    const options: TextureOptions = {
      name: url,
      format: 'RGBA32_FLOAT',
      source: new ArrayBufferViewSource([[data]], hdr.width, hdr.height),
      width: hdr.width,
      height: hdr.height,
      type: 'Texture2D',
      generateMipmap: true,
      sampler: SamplerState.LinearClampNoMipMap,
    }

    return {
      source: url,
      textures: [options],
    }
  }
}
