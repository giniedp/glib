import { TextureCompression } from '@gglib/graphics'
import { LevelImage } from '../format'
import BASIS from './basis_transcoder.js'
import { BasisTranscodeFormat, KTX2File, TranscoderModule, TranscoderOptions } from './types'

export interface TextureData {
  width: number
  height: number
  format: BasisTranscodeFormat
  levelImages: LevelImage[]
}

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

export function transcodeKtx(
  module: TranscoderModule,
  data: Uint8Array | ArrayBuffer,
  compression: TextureCompression[],
) {
  if (data instanceof ArrayBuffer) {
    data = new Uint8Array(data)
  }
  const file = new module.KTX2File(data)
  try {
    return transcodeKtxFile(file, compression)
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
      width: info.width,
      height: info.height,
      layers: layerList,
    })
  }

  return {
    width,
    height,
    format,
    levelImages,
  }
}

function getTranscodeFormat(file: KTX2File, compression: TextureCompression[]) {
  // https://github.com/KhronosGroup/3D-Formats-Guidelines/blob/main/KTXDeveloperGuide.md
  if (file.isETC1S()) {
    if (file.getHasAlpha() && compression.includes('etc2')) {
      return BasisTranscodeFormat.ETC2_RGBA
    }
    if (compression.includes('etc1')) {
      return BasisTranscodeFormat.ETC1_RGB
    }
    if (compression.includes('bptc')) {
      return BasisTranscodeFormat.BC7_M5_RGBA
    }
    if (compression.includes('bc')) {
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
    return BasisTranscodeFormat.RGBA32
  }

  if (file.isUASTC()) {
    if (compression.includes('astc')) {
      return BasisTranscodeFormat.ASTC_4x4_RGBA
    }
    if (compression.includes('bptc')) {
      return BasisTranscodeFormat.BC7_M5_RGBA
    }
    if (compression.includes('etc2') && file.getHasAlpha()) {
      return BasisTranscodeFormat.ETC2_RGBA
    }
    if (compression.includes('etc1')) {
      return BasisTranscodeFormat.ETC1_RGB
    }
    if (compression.includes('bc')) {
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
    return BasisTranscodeFormat.RGBA32
  }

  throw new Error('Unsupported Basis format')
}
