import { BinaryReader } from '@gglib/utils'
import { ArrayType, GLConst as gl } from '@gglib/graphics'

// KTX 1 Format: https://www.khronos.org/opengles/sdk/tools/KTX/file_format_spec/
// KTX 2 Format: https://github.khronos.org/KTX-Specification
// Other links:
//  - https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
//  - https://www.khronos.org/registry/vulkan/specs/1.1-extensions/man/html/VkFormat.html

export interface KTXHeader {
  identifier: string
  vkFormat: number
  typeSize: number
  pixelWidth: number
  pixelHeight: number
  pixelDepth: number
  layerCount: number
  faceCount: number
  levelCount: number
  supercompressionScheme: number
}

export interface KTXIndex {
  dfdByteOffset: number
  dfdByteLength: number
  kvdByteOffset: number
  kvdByteLength: number
  sgdByteOffset: number
  sgdByteLength: number
}

export interface KTXLevelIndex {
  byteOffset: number
  byteLength: number
  uncompressedByteLength: number
}

export interface KTXLevelImage {
  level: number
  width: number
  height: number
  layers: ReadonlyArray<{ faces: Uint8ClampedArray[] }>
}

export interface KTXFormatInfo {
  glInternalFormat: GLenum
  glFormat: GLenum
  glType: GLenum
}

const enum VK_FORMAT {
  R16G16B16A16_SFLOAT = 97,
  R32G32B32A32_SFLOAT = 109,
}

const VK_TO_GL: { [k: number]: KTXFormatInfo } = {
  [VK_FORMAT.R16G16B16A16_SFLOAT]: {
    glInternalFormat: gl.RGBA16F,
    glType: gl.HALF_FLOAT,
    glFormat: gl.RGBA,
  },
  [VK_FORMAT.R32G32B32A32_SFLOAT]: {
    glInternalFormat: gl.RGBA32F,
    glType: gl.FLOAT,
    glFormat: gl.RGBA,
  }
}

function readHeader(reader: BinaryReader): KTXHeader {
  return {
    /* Byte[12]*/ identifier: reader.readString(12),
    /* UInt32  */ vkFormat: reader.readUInt(),
    /* UInt32  */ typeSize: reader.readUInt(),
    /* UInt32  */ pixelWidth: reader.readUInt(),
    /* UInt32  */ pixelHeight: reader.readUInt(),
    /* UInt32  */ pixelDepth: reader.readUInt(),
    /* UInt32  */ layerCount: reader.readUInt(),
    /* UInt32  */ faceCount: reader.readUInt(),
    /* UInt32  */ levelCount: reader.readUInt(),
    /* UInt32  */ supercompressionScheme: reader.readUInt(),
  }
}

function readIndex(reader: BinaryReader): KTXIndex {
  return {
    /* UInt32 */ dfdByteOffset: reader.readUInt(),
    /* UInt32 */ dfdByteLength: reader.readUInt(),
    /* UInt32 */ kvdByteOffset: reader.readUInt(),
    /* UInt32 */ kvdByteLength: reader.readUInt(),
    /* UInt64 */ sgdByteOffset: reader.readLong(),
    /* UInt64 */ sgdByteLength: reader.readLong(),
  }
}

function readLevelIndex(reader: BinaryReader): KTXLevelIndex {
  return {
    /* UInt64 */ byteOffset: reader.readLong(),
    /* UInt64 */ byteLength: reader.readLong(),
    /* UInt64 */ uncompressedByteLength: reader.readLong(),
  }
}

function readLevelImage(reader: BinaryReader, header: KTXHeader, index: KTXLevelIndex, level: number): KTXLevelImage {
  reader.seekAbsolute(index.byteOffset)

  const layers: Array<{ faces: Uint8ClampedArray[] }> = []
  for (let l = 0; l < Math.max(1, header.layerCount); l++) {
    const faces: Uint8ClampedArray[] = []
    for (let i = 0; i < header.faceCount; i++) {
      const faceLength = index.byteLength / header.faceCount
      const faceOffset = index.byteOffset + faceLength * i
      const spec = VK_TO_GL[header.vkFormat]
      const data = new ArrayType[spec.glType](reader.view.buffer, faceOffset, faceLength / header.typeSize)
      faces.push(data)
    }
    layers.push({
      faces: faces
    })
  }

  const divisor = Math.pow(2, level)
  return {
    level: level + 1,
    width: header.pixelWidth / divisor,
    height: header.pixelHeight / divisor,
    layers: layers,
  }
}

export class KTX {
  public static parse(data: ArrayBuffer) {
    return new KTX(data)
  }

  public readonly header: KTXHeader
  public readonly index: KTXIndex
  public readonly levelIndex: ReadonlyArray<KTXLevelIndex>
  public readonly levelImages: ReadonlyArray<KTXLevelImage>
  public readonly glInfo: KTXFormatInfo

  public get width() {
    return this.header.pixelWidth
  }

  public get height() {
    return this.header.pixelHeight
  }

  public get depth() {
    return this.header.pixelDepth
  }

  public constructor(buffer: ArrayBuffer) {
    const reader = new BinaryReader(buffer)
    this.header = readHeader(reader)
    this.index = readIndex(reader)
    this.glInfo = VK_TO_GL[this.header.vkFormat]
    const lvlIndex: KTXLevelIndex[] = this.levelIndex = []
    const lvlImages: KTXLevelImage[] = this.levelImages = []

    if (this.header.supercompressionScheme !== 0) {
      console.error(`[KTX] supercompressionScheme is not supported: ${this.header.supercompressionScheme}`)
      return
    }
    if (!this.glInfo) {
      console.error(`[KTX] vkFormat is not supported: ${this.header.vkFormat}`)
    }

    for (let i = 0; i < this.header.levelCount; i++) {
      lvlIndex[i] = readLevelIndex(reader)
    }

    for (let i = 0; i < this.header.levelCount; i++) {
      lvlImages[i] = readLevelImage(reader, this.header, lvlIndex[i], i)
    }
  }
}
