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
  public static create = () => new Loader()
  public static register(registry = ContentLoader.loaders) {
    registry.register(Loader)
  }

  private static defaultTransocder: Transcoder
  public static getDefaultTransocder() {
    Loader.defaultTransocder ||= new Transcoder(Loader.defaultOptions)
    return Loader.defaultTransocder
  }

  private static defaultOptions: TranscoderOptions = {
    wasmUrl: '/basis_transcoder.wasm',
  }
  public static setDefaultOptions(options: TranscoderOptions) {
    Loader.defaultOptions = options
  }

  public transcoder: Transcoder
  public constructor(transcoder?: Transcoder) {
    this.transcoder = transcoder || Loader.getDefaultTransocder()
  }

  public async load(url: string, context: LoadContext): Promise<AssetContainer> {
    const response = await context.content.fetch(url, {
      responseType: 'arraybuffer',
    })

    const ktx = parse(response.body)

    const options: AcquireTextureOptions = {
      key: url,
      name: url,
      type: ktx.isCubemap ? 'cube' : ktx.isVolume ? '3d' : '2d',
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
  [BasisTranscodeFormat.ETC1_RGB]: 'etc2-rgb8unorm',
  [BasisTranscodeFormat.ETC2_RGBA]: 'etc2-rgba8unorm',
  [BasisTranscodeFormat.BC1_RGB]: 'bc1-rgba-unorm',
  [BasisTranscodeFormat.BC3_RGBA]: 'bc3-rgba-unorm',
  [BasisTranscodeFormat.BC4_R]: 'bc4-r-unorm',
  [BasisTranscodeFormat.BC5_RG]: 'bc5-rg-unorm',
  [BasisTranscodeFormat.BC7_M6_RGB]: 'bc7-rgba-unorm',
  [BasisTranscodeFormat.BC7_M5_RGBA]: 'bc7-rgba-unorm',
  // [BasisTranscodeFormat.PVRTC1_4_RGB]: SurfaceFormat.COMPRESSED_RGB_PVRTC_4BPPV1_IMG,
  // [BasisTranscodeFormat.PVRTC1_4_RGBA]: SurfaceFormat.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG,
  [BasisTranscodeFormat.ASTC_4x4_RGBA]: 'astc-4x4-unorm',
  // [BasisTranscodeFormat.ATC_RGB]: SurfaceFormat.COMPRESSED_RGB_ATC,
  // [BasisTranscodeFormat.ATC_RGBA_INTERPOLATED_ALPHA]: SurfaceFormat.COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA,
  [BasisTranscodeFormat.RGBA32]: 'rgba8unorm',
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
