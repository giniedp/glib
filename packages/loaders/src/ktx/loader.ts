import { AssetContainer, AssetLoader, ContentLoader, LoadContext, TextureAssetContainer } from '@gglib/content'
import {
  AcquireTextureOptions,
  CompressedFaceData,
  SurfaceFormat,
  surfaceFormatInfo,
  TextureSource,
} from '@gglib/graphics'
import { LevelImage, parse } from './format'
import { Transcoder } from './ktx.transcoder'
import { BasisTranscodeFormat, TranscoderOptions } from './transcoder/types'

export class Loader implements AssetLoader {
  public static extensions = ['.ktx', '.ktx2']
  public static mimeTypes = ['image/ktx', 'image/ktx2']
  public static create = () => new Loader(Loader.defaultOptions)
  public static register(registry = ContentLoader.loaders) {
    registry.register(Loader)
  }

  private static defaultOptions: TranscoderOptions = {
    wasmUrl: '/basis_transcoder.wasm',
  }
  public static setDefaultOptions(options: TranscoderOptions) {
    Loader.defaultOptions = options
  }

  public transcoder: Transcoder
  public constructor(options: TranscoderOptions) {
    this.transcoder = new Transcoder(options || Loader.defaultOptions)
  }

  public async load(url: string, context: LoadContext): Promise<AssetContainer> {
    const response = await context.content.fetch(url, {
      responseType: 'arraybuffer',
    })

    const ktx = parse(response.body)

    const options: AcquireTextureOptions = {
      key: url,
      name: url,
      type: ktx.isCubemap ? 'TextureCube' : ktx.isVolume ? 'Texture3D' : 'Texture2D',
      width: ktx.width,
      height: ktx.height,
      generateMipmap: false,
      mipLevelCount: ktx.levelImages.length,
      format: ktx.format,
    }
    let images: LevelImage[]
    if (ktx.isCompressed) {
      const data = await this.transcode(response.body, context)
      images = data.images
      options.format = data.format
      options.mipLevelCount = images.length
    } else {
      images = ktx.levelImages
    }

    const levels: Array<Array<CompressedFaceData>> = []
    for (let lvl = 0; lvl < images.length; lvl++) {
      const level = images[lvl]
      levels[lvl] = []
      const faces = ktx.isCubemap ? 6 : 1
      const layout = textureDataLayout(options.format, level.width, level.height)
      for (let face = 0; face < faces; face++) {
        for (let layer = 0; layer < level.layers.length; layer++) {
          const buffer = level.layers[layer].faces[face]
          levels[lvl].push({
            data: buffer,
            bytesPerRow: layout.bytesPerRow,
            rows: layout.rowsPerImage,
          })
        }
      }
    }

    options.source = new TextureSource({
      levels,
      width: ktx.width,
      height: ktx.height,
    })
    return new TextureAssetContainer([options])
  }

  public async transcode(data: ArrayBuffer, context: LoadContext) {
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

function textureDataLayout(
  format: SurfaceFormat,
  width: number,
  height: number,
): { bytesPerRow: number; rowsPerImage: number } {
  const info = surfaceFormatInfo(format)

  if (info.compression) {
    const blocksPerRow = Math.ceil(width / info.blockWidth)
    const blockRows = Math.ceil(height / info.blockHeight)
    return {
      bytesPerRow: blocksPerRow * info.bytesPerBlock,
      rowsPerImage: blockRows,
    }
  }

  return {
    bytesPerRow: width * info.bytesPerPixel,
    rowsPerImage: height,
  }
}
