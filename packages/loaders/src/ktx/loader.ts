import { AssetContainer, AssetLoader, ContentLoader, LoaderContext } from '@gglib/content'
import { ArrayBufferViewSource, SamplerState, SurfaceFormat, TextureOptions } from '@gglib/graphics'
import { LevelImage, parse } from './format'
import { BasisTranscodeFormat, Transcoder } from './transcoder'

export function registerLoader() {
  ContentLoader.registerLoader(Loader)
}

export class Loader implements AssetLoader {
  public static extensions = ['.ktx', '.ktx2']
  public static mimeTypes = ['image/ktx', 'image/ktx2']
  public static loader = Loader
  public static wasmUrl = '/basis_transcoder.wasm'

  public transcoder: Transcoder

  public async load(url: string, context: LoaderContext): Promise<AssetContainer> {
    const response = await context.content.fetch(url, {
      responseType: 'arraybuffer',
    })

    const ktx = parse(response.body)
    const options: TextureOptions = {
      width: ktx.width,
      height: ktx.height,
      type: 'Texture2D',
      generateMipmap: false,
      sampler: SamplerState.LinearClampNoMipMap,
    }
    let images: LevelImage[]
    if (ktx.isCompressed) {
      const data = await this.transcode(response.body, context)
      images = data.images
      options.format = data.format
    } else {
      images = ktx.levelImages
      options.format = ktx.format
    }

    const levelCount = images.length
    const levels: Array<Array<ArrayBufferView>> = []
    const level0 = images[0]
    const layer0 = level0.layers[0]
    const isCubemap = layer0.faces?.length === 6
    for (let lvl = 0; lvl < images.length; lvl++) {
      const level = images[lvl]
      levels[lvl] = []
      if (isCubemap) {
        for (let face = 0; face < 6; face++) {
          levels[lvl].push(level.layers[0].faces[face])
        }
      } else {
        for (let layer = 0; layer < level.layers.length; layer++) {
          levels[lvl].push(level.layers[layer].faces[0])
        }
      }
    }
    options.source = new ArrayBufferViewSource(levels, ktx.width, ktx.height)

    // TODO: handle 3D textures and 2D arrays
    if (isCubemap) {
      options.type = 'TextureCube'
    }
    if (levelCount > 1) {
      // options.sampler = SamplerState.LinearWrap
    }

    return {
      source: url,
      textures: [options],
    }
  }

  public async transcode(data: ArrayBuffer, context: LoaderContext) {
    this.transcoder ||= new Transcoder({
      wasmUrl: Loader.wasmUrl,
    })

    const ktx = await this.transcoder.transcode(data, context.content.device.capabilities.textureCompression)
    const format = COMPRESSED_SURFACE_FORMATS[ktx.format]
    if (!format) {
      throw new Error(`Unsupported KTX format: ${ktx.format}`)
    }
    return {
      images: ktx.levelImages,
      format: format,
    }
  }
}

const COMPRESSED_SURFACE_FORMATS: Partial<Record<BasisTranscodeFormat, SurfaceFormat>> = {
  [BasisTranscodeFormat.ETC1_RGB]: 'ETC2_RGB8_UNORM',
  [BasisTranscodeFormat.ETC2_RGBA]: 'ETC2_RGBA8_UNORM',
  [BasisTranscodeFormat.BC1_RGB]: 'BC1_RGBA_UNORM',
  [BasisTranscodeFormat.BC3_RGBA]: 'BC3_RGBA_UNORM',
  [BasisTranscodeFormat.BC4_R]: 'BC4_R_UNORM',
  [BasisTranscodeFormat.BC5_RG]: 'BC5_RG_UNORM',
  [BasisTranscodeFormat.BC7_M6_RGB]: 'BC7_RGBA_UNORM',
  [BasisTranscodeFormat.BC7_M5_RGBA]: 'BC7_RGBA_UNORM',
  // [BasisTranscodeFormat.PVRTC1_4_RGB]: SurfaceFormat.COMPRESSED_RGB_PVRTC_4BPPV1_IMG,
  // [BasisTranscodeFormat.PVRTC1_4_RGBA]: SurfaceFormat.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG,
  [BasisTranscodeFormat.ASTC_4x4_RGBA]: 'ASTC_4x4_UNORM',
  // [BasisTranscodeFormat.ATC_RGB]: SurfaceFormat.COMPRESSED_RGB_ATC,
  // [BasisTranscodeFormat.ATC_RGBA_INTERPOLATED_ALPHA]: SurfaceFormat.COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA,
  [BasisTranscodeFormat.RGBA32]: 'RGBA8_UNORM',
  // [BasisTranscodeFormat.RGB565]: SurfaceFormat.RGB565,
  // [BasisTranscodeFormat.BGR565]: SurfaceFormat.BGR565,
  // [BasisTranscodeFormat.RGBA4444]: SurfaceFormat.RGBA4,
}
