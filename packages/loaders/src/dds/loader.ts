import { AssetContainer, AssetLoader, ContentLoader, LoaderContext } from '@gglib/content'
import { ArrayBufferViewSource, SamplerState, surfaceFormatFromDXGI, TextureOptions } from '@gglib/graphics'
import { parse } from './format'

export function registerLoader() {
  ContentLoader.registerLoader(Loader)
}

export class Loader implements AssetLoader {
  public static extensions = ['.dds']
  public static mimeTypes = ['image/vnd.ms-dds']
  public static loader = Loader

  public async load(url: string, context: LoaderContext): Promise<AssetContainer> {
    const response = await context.content.fetch(url, {
      responseType: 'arraybuffer',
    })

    const dds = parse(response.body)
    const format = surfaceFormatFromDXGI(dds.format)

    if (!context.content.device.capabilities.isFormatSupported(format)) {
      throw new Error(`Surface format ${format} is not supported by the device capabilities.`)
    }
    const options: TextureOptions = {
      width: dds.width,
      height: dds.height,
      type: 'Texture2D',
      generateMipmap: false,
      sampler: SamplerState.LinearClampNoMipMap,
      format: format,
    }
    if (dds.isCubemap) {
      options.type = 'TextureCube'
    }

    const levels: Array<Array<ArrayBufferView>> = []
    for (let lvl = 0; lvl < dds.images.length; lvl++) {
      const level = dds.images[lvl]
      levels[lvl] = []
      for (let face of level.faces) {
        levels[lvl].push(face)
      }
    }
    options.source = new ArrayBufferViewSource(levels, dds.width, dds.height)
    console.log(options)
    return {
      source: url,
      textures: [options],
    }
  }
}
