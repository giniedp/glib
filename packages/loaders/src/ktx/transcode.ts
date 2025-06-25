import type { Capabilities } from '@gglib/graphics'
import BASIS from './basis_transcoder.js'
import { LevelImage } from './format/KTX.js'

export interface TranscodeOptions {
  wasmUrl?: string
  wasmBinary?: ArrayBuffer
}

export type Transcoder = Awaited<ReturnType<typeof transcoder> >
export async function transcoder(options: TranscodeOptions) {
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

  return {
    transcode(data: Uint8Array, capabilities: Capabilities) {
      const file = new module.KTX2File(data)
      try {
        return transcodeKtx(file, capabilities)
      } finally {
        file.close()
      }
    },
  }
}

export interface TextureData {
  width: number
  height: number
  format: BasisTranscodeFormat
  levelImages: LevelImage[]
}

function transcodeKtx(file: KTX2File, capabilities: Capabilities): TextureData {
  if (!file.isValid()) {
    throw new Error('Invalid KTX2 file')
  }

  const width = file.getWidth()
  const height = file.getHeight()
  const layers = file.getLayers() || 1
  const faces = file.getFaces() || 1
  const levels = file.getLevels() || 1
  const format = getTranscodeFormat(file, capabilities)
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
        faces: facesList
      })
    }
    const info = file.getImageLevelInfo( level, 0, 0 );
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

function getTranscodeFormat(file: KTX2File, capabilities: Capabilities) {
  // https://github.com/KhronosGroup/3D-Formats-Guidelines/blob/main/KTXDeveloperGuide.md
  if (file.isETC1S()) {
    if (file.getHasAlpha() && capabilities.textureCompressionEtc2) {
      return BasisTranscodeFormat.ETC2_RGBA
    }
    if (capabilities.textureCompressionEtc1) {
      return BasisTranscodeFormat.ETC1_RGB
    }
    if (capabilities.textureCompressionBptc) {
      return BasisTranscodeFormat.BC7_M5_RGBA
    }
    if (capabilities.textureCompressionBc) {
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
    if (capabilities.textureCompressionAstc) {
      return BasisTranscodeFormat.ASTC_4x4_RGBA
    }
    if (capabilities.textureCompressionBptc) {
      return BasisTranscodeFormat.BC7_M5_RGBA
    }
    if (capabilities.textureCompressionEtc2 && file.getHasAlpha()) {
      return BasisTranscodeFormat.ETC2_RGBA
    }
    if (capabilities.textureCompressionEtc1) {
      return BasisTranscodeFormat.ETC1_RGB
    }
    if (capabilities.textureCompressionBc) {
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

interface TranscoderModule {
  initializeBasis(): Promise<void>
  setDebugFlags(flags: number): void
  getDebugFlags(): number

  BasisFile: { new (data: Uint8Array): BasisFile }
  KTX2File: { new (data: Uint8Array): KTX2File }

  // Utility functions
  getBytesPerBlockOrPixel(format: number): number
  formatHasAlpha(format: number): boolean
  formatIsHDR(format: number): boolean
  formatIsLDR(format: number): boolean
  formatIsUncompressed(format: number): boolean
  isFormatSupported(format: number): boolean
  getFormatBlockWidth(format: number): number
  getFormatBlockHeight(format: number): number
  getBasisTexFormatBlockWidth(format: number): number
  getBasisTexFormatBlockHeight(format: number): number
  isBasisTexFormatHDR(format: number): boolean
  isBasisTexFormatLDR(format: number): boolean
  convertFloatToHalf(val: number): number
  convertHalfToFloat(val: number): number

  // KTX2 support
  transcoderSupportsKTX2(): boolean
  transcoderSupportsKTX2Zstd(): boolean

  // Low-level ETC1S transcoder
  LowLevelETC1SImageTranscoder: new () => {
    decodePalettes(...args: any[]): any
    decodeTables(...args: any[]): any
    transcodeImage(...args: any[]): any
  }

  // UASTC transcoder
  transcodeUASTCImage(...args: any[]): any
}

export enum BasisTranscodeFormat {
  ETC1_RGB = 0,
  ETC2_RGBA = 1,
  BC1_RGB = 2,
  BC3_RGBA = 3,
  BC4_R = 4,
  BC5_RG = 5,
  BC7_M6_RGB = 6,
  BC7_M5_RGBA = 7,
  PVRTC1_4_RGB = 8,
  PVRTC1_4_RGBA = 9,
  ASTC_4x4_RGBA = 10,
  // ATC_RGB = 11,
  // ATC_RGBA_INTERPOLATED_ALPHA = 12,
  RGBA32 = 13,
  // RGB565 = 14,
  // BGR565 = 15,
  // RGBA4444 = 16,
}

export enum BasisDecodeFlags {
  PVRTC_WRAP_REPEAT = 2,
  TRANSCODE_ALPHA_DATA_TO_OPAQUE_FORMATS = 4,
  HIGH_QUALITY = 32,
}

export interface BasisFile {
  close(): void
  getHasAlpha(): boolean
  getBasisTexFormat(): number
  isUASTC_LDR_4x4(): boolean
  isUASTC(): boolean
  isETC1S(): boolean
  isHDR(): boolean
  isHDR4x4(): boolean
  isHDR6x6(): boolean
  isLDR(): boolean
  getNumImages(): number
  getNumLevels(imageIndex: number): number
  getImageWidth(imageIndex: number, levelIndex: number): number
  getImageHeight(imageIndex: number, levelIndex: number): number
  getBlockWidth(): number
  getBlockHeight(): number
  getImageTranscodedSizeInBytes(imageIndex: number, levelIndex: number, format: number): number
  startTranscoding(): boolean
  transcodeImage(
    dst: Uint8Array,
    imageIndex: number,
    levelIndex: number,
    format: number,
    unused: number,
    getAlphaForOpaqueFormats: number,
  ): boolean
  transcodeImageWithFlags(
    dst: Uint8Array,
    imageIndex: number,
    levelIndex: number,
    format: number,
    flags: number,
  ): boolean
  getFileDesc(): BasisFileDesc
  getImageDesc(imageIndex: number): BasisImageDesc
  getImageLevelDesc(imageIndex: number, levelIndex: number): BasisImageLevelDesc
  delete(): void
}

export interface KTX2File {
  isValid(): boolean
  close(): void
  getDFDSize(): number
  getDFD(): Uint8Array
  getHeader(): KTX2Header
  hasKey(key: string): boolean
  getTotalKeys(): number
  getKey(index: number): string
  getKeyValueSize(key: string): number
  getKeyValue(key: string): Uint8Array
  getWidth(): number
  getHeight(): number
  getBlockWidth(): number
  getBlockHeight(): number
  getFaces(): number
  getLayers(): number
  getLevels(): number
  getBasisTexFormat(): number
  isUASTC_LDR_4x4(): boolean
  isUASTC(): boolean
  isHDR(): boolean
  isHDR4x4(): boolean
  isHDR6x6(): boolean
  isLDR(): boolean
  isETC1S(): boolean
  getHasAlpha(): boolean
  getDFDColorModel(): number
  getDFDColorPrimaries(): number
  getDFDTransferFunc(): number
  getDFDFlags(): number
  getDFDTotalSamples(): number
  getDFDChannelID0(): number
  getDFDChannelID1(): number
  isVideo(): boolean
  getLDRHDRUpconversionNitMultiplier(): number
  getETC1SImageDescImageFlags(): number
  getImageLevelInfo(level: number, layer: number, face: number): KTX2ImageLevelInfo
  getImageTranscodedSizeInBytes(level: number, layer: number, face: number, format: number): number
  startTranscoding(): boolean
  transcodeImage(
    dst: Uint8Array,
    level: number,
    layer: number,
    face: number,
    format: number,
    getAlphaForOpaqueFormats: number,
    channel0: number,
    channel1: number,
  ): boolean
  transcodeImageWithFlags(
    dst: Uint8Array,
    imageIndex: number,
    levelIndex: number,
    format: number,
    flags: number,
  ): boolean
  delete(): void
}

export interface BasisFileDesc {
  version: number
  usPerFrame: number
  totalImages: number
  userdata0: number
  userdata1: number
  texFormat: number
  yFlipped: boolean
  hasAlphaSlices: boolean
  numEndpoints: number
  endpointPaletteOfs: number
  endpointPaletteLen: number
  numSelectors: number
  selectorPaletteOfs: number
  selectorPaletteLen: number
  tablesOfs: number
  tablesLen: number
  blockWidth: number
  blockHeight: number
}

export interface BasisImageDesc {
  origWidth: number
  origHeight: number
  numBlocksX: number
  numBlocksY: number
  numLevels: number
  blockWidth: number
  blockHeight: number
  alphaFlag: number
  iframeFlag: number
}

export interface BasisImageLevelDesc {
  rgbFileOfs: number
  rgbFileLen: number
  alphaFileOfs: number
  alphaFileLen: number
}

export interface KTX2ImageLevelInfo {
  levelIndex: number
  layerIndex: number
  faceIndex: number
  origWidth: number
  origHeight: number
  width: number
  height: number
  numBlocksX: number
  numBlocksY: number
  blockWidth: number
  blockHeight: number
  totalBlocks: number
  alphaFlag: number
  iframeFlag: number
}

export interface KTX2Header {
  vkFormat: number
  typeSize: number
  pixelWidth: number
  pixelHeight: number
  pixelDepth: number
  layerCount: number
  faceCount: number
  levelCount: number
  supercompressionScheme: number
  dfdByteOffset: number
  dfdByteLength: number
  kvdByteOffset: number
  kvdByteLength: number
  sgdByteOffset: number
  sgdByteLength: number
}
