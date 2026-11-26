import type { TextureCompression } from '@gglib/graphics'
import type { LevelImage } from '../format'
import BASIS from './basis_transcoder.js'
import { BasisTranscodeFormat, KTX2File, TranscoderModule, TranscoderOptions } from './types'

export interface TextureData {
  width: number
  height: number
  format: BasisTranscodeFormat
  /**
   * Whether the data is sRGB encoded (the transfer function of the file's data format descriptor), the texture then
   * takes the `-srgb` variant of the format
   */
  srgb: boolean
  levelImages: LevelImage[]
}

/**
 * KHR_DF_TRANSFER_SRGB of the data format descriptor
 */
const TRANSFER_SRGB = 2

/**
 * KHR_DF_CHANNEL_UASTC_RRR: UASTC data with one channel (e.g. a `ktx create --format R8_UNORM` file)
 */
const CHANNEL_UASTC_RRR = 4

export async function transcoderModule(options: TranscoderOptions): Promise<TranscoderModule> {
  const module: TranscoderModule = await BASIS({
    wasmBinary: options.wasmBinary,
    locateFile: (path: string) => {
      if (path.endsWith('.wasm')) {
        return options.wasmUrl
      }
      return path
    },
  })
  await module.initializeBasis()
  return module
}

export function transcodeKtx(module: TranscoderModule, data: Uint8Array | ArrayBuffer, supports: TextureCompression[]) {
  if (data instanceof ArrayBuffer) {
    data = new Uint8Array(data)
  }
  const file = new module.KTX2File(data)
  try {
    return transcodeKtxFile(file, supports)
  } finally {
    file.close()
  }
}

export function transcodeKtxFile(file: KTX2File, compression: TextureCompression[]): TextureData {
  if (!file.isValid()) {
    throw new Error('Invalid KTX2 file')
  }

  const width = file.getWidth()
  const height = file.getHeight()
  const layers = file.getLayers() || 1
  const faces = file.getFaces() || 1
  const levels = file.getLevels() || 1
  const format = getTranscodeFormat(file, compression)
  if (!file.startTranscoding()) {
    throw new Error('Failed to start transcoding')
  }

  const levelImages: LevelImage[] = []

  for (let level = 0; level < levels; level++) {
    const layerList: LevelImage['layers'] = []

    for (let layer = 0; layer < layers; layer++) {
      const facesList: Array<Uint8Array<ArrayBuffer>> = []
      for (let face = 0; face < faces; face++) {
        const size = file.getImageTranscodedSizeInBytes(level, layer, face, format)
        const target = new Uint8Array(size)
        const status = file.transcodeImage(target, level, layer, face, format, 0, -1, -1)
        if (!status) {
          throw new Error(`Failed to transcode image at level ${level}, layer ${layer}, face ${face}`)
        }

        facesList.push(target)
      }
      layerList.push({
        faces: facesList,
      })
    }
    const info = file.getImageLevelInfo(level, 0, 0)
    levelImages.push({
      // width and height are padded to whole blocks, uncompressed data has the size of the level
      width: info.origWidth,
      height: info.origHeight,
      layers: layerList,
    })
  }

  return {
    width,
    height,
    format,
    srgb: file.getDFDTransferFunc() === TRANSFER_SRGB,
    levelImages,
  }
}

function getTranscodeFormat(file: KTX2File, supports: TextureCompression[]) {
  // https://github.com/KhronosGroup/3D-Formats-Guidelines/blob/main/KTXDeveloperGuide.md
  if (file.isETC1S()) {
    if (file.getHasAlpha() && supports.includes('etc2')) {
      return BasisTranscodeFormat.ETC2_RGBA
    }
    if (supports.includes('etc1')) {
      return BasisTranscodeFormat.ETC1_RGB
    }
    if (supports.includes('bptc')) {
      return BasisTranscodeFormat.BC7_M5_RGBA
    }
    if (supports.includes('bc')) {
      if (file.getHasAlpha()) {
        return BasisTranscodeFormat.BC3_RGBA
      }
      return BasisTranscodeFormat.BC1_RGB
    }
    // intentionally disabled
    // pvrtc is not supported in webgpu and our engine formats are based on webgpu
    // even if webgl supports it, we don't have a mapping for it
    //
    // if (capabilities.textureCompressionPvrtc) {
    //   if (file.getHasAlpha()) {
    //     return BasisTranscodeFormat.PVRTC1_4_RGBA
    //   }
    //   return BasisTranscodeFormat.PVRTC1_4_RGB
    // }
    if (supports.includes('etc2')) {
      // ETC2 decodes ETC1 blocks, files with alpha took ETC2_RGBA
      return BasisTranscodeFormat.ETC1_RGB
    }
    return BasisTranscodeFormat.RGBA32
  }

  if (file.isUASTC()) {
    // one channel data: BC4 holds it at half the size of BC7
    if (file.getDFDChannelID0() === CHANNEL_UASTC_RRR && supports.includes('bc')) {
      return BasisTranscodeFormat.BC4_R
    }
    if (supports.includes('astc')) {
      return BasisTranscodeFormat.ASTC_4x4_RGBA
    }
    if (supports.includes('bptc')) {
      return BasisTranscodeFormat.BC7_M5_RGBA
    }
    if (supports.includes('etc2') && file.getHasAlpha()) {
      return BasisTranscodeFormat.ETC2_RGBA
    }
    if (supports.includes('etc1')) {
      return BasisTranscodeFormat.ETC1_RGB
    }
    if (supports.includes('bc')) {
      if (file.getHasAlpha()) {
        return BasisTranscodeFormat.BC3_RGBA
      }
      return BasisTranscodeFormat.BC1_RGB
    }
    // intentionally disabled
    // pvrtc is not supported in webgpu and our engine formats are based on webgpu
    // even if webgl supports it, we don't have a mapping for it
    //
    // if (capabilities.textureCompressionPvrtc) {
    //   if (file.getHasAlpha()) {
    //     return BasisTranscodeFormat.PVRTC1_4_RGBA
    //   }
    //   return BasisTranscodeFormat.PVRTC1_4_RGB
    // }
    if (supports.includes('etc2')) {
      // ETC2 decodes ETC1 blocks, files with alpha took ETC2_RGBA
      return BasisTranscodeFormat.ETC1_RGB
    }
    return BasisTranscodeFormat.RGBA32
  }

  throw new Error('Unsupported Basis format')
}
