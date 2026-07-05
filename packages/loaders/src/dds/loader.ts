import { AssetContainer, AssetLoader, ContentLoader, LoaderContext, TextureAssetContainer } from '@gglib/content'
import {
  AcquireTextureOptions,
  CompressedBufferSource,
  CompressedFaceData,
  surfaceFormatFromDXGI,
} from '@gglib/graphics'
import { parse } from './format'

export class Loader implements AssetLoader {
  public static extensions = ['.dds']
  public static mimeTypes = ['image/vnd.ms-dds']
  public static create = () => new Loader()
  public static register(registry = ContentLoader.loaders) {
    registry.register(Loader)
  }

  public async load(url: string, context: LoaderContext): Promise<AssetContainer> {
    const response = await context.content.fetch(url, {
      responseType: 'arraybuffer',
    })

    const dds = parse(response.body)
    const format = surfaceFormatFromDXGI(dds.format)

    if (format == null || !context.content.device.capabilities.isFormatSupported(format)) {
      throw new Error(`Surface format ${format} (${dds.format}) is not supported by the device capabilities.`)
    }

    if (!dds.images?.length) {
      throw new Error(`DDS file contains no image data.`)
    }

    if (dds.isCubemap && dds.images.some((level) => level.faces.length !== 6)) {
      throw new Error(`DDS cubemap file contains a mip level with less than 6 faces.`)
    }

    const options: AcquireTextureOptions = {
      key: url,
      name: url,
      type: dds.isCubemap ? 'TextureCube' : dds.isVolume ? 'Texture3D' : 'Texture2D',
      width: dds.width,
      height: dds.height,
      generateMipmap: false,
      mipLevelCount: dds.images.length,
      format: format,
    }

    const levels: Array<Array<CompressedFaceData>> = []
    for (let lvl = 0; lvl < dds.images.length; lvl++) {
      const level = dds.images[lvl]
      levels[lvl] = []
      for (let face of level.faces) {
        levels[lvl].push(face)
      }
    }
    options.source = new CompressedBufferSource(levels, dds.width, dds.height)
    return new TextureAssetContainer([options])
  }
}
