import { dataTypeToArrayType, SurfaceFormat, surfaceFormatDataType, surfaceFormatFromVulkan } from '@gglib/graphics'
import { BinaryReader } from '@gglib/utils'

// KTX 1 Format: https://registry.khronos.org/KTX/specs/1.0/ktxspec.v1.html
// KTX 2 Format: https://registry.khronos.org/KTX/specs/2.0/ktxspec.v2.html
// Other links:
//  - https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
//  - https://www.khronos.org/registry/vulkan/specs/1.1-extensions/man/html/VkFormat.html
//  - https://github.com/KhronosGroup/KTX-Software
//  - https://www.khronos.org/registry/webgl/specs/latest/2.0/
//  - https://github.com/KhronosGroup/KTX-Specification/blob/master/formats.json

export interface Header {
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

export interface Index {
  dfdByteOffset: number
  dfdByteLength: number
  kvdByteOffset: number
  kvdByteLength: number
  sgdByteOffset: number
  sgdByteLength: number
}

export interface LevelIndex {
  byteOffset: number
  byteLength: number
  uncompressedByteLength: number
}

export interface LevelImage {
  width: number
  height: number
  layers: Array<{
    faces: Array<Uint8Array<ArrayBuffer>>
  }>
}

function readHeader(reader: BinaryReader): Header {
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

function readIndex(reader: BinaryReader): Index {
  return {
    /* UInt32 */ dfdByteOffset: reader.readUInt(),
    /* UInt32 */ dfdByteLength: reader.readUInt(),
    /* UInt32 */ kvdByteOffset: reader.readUInt(),
    /* UInt32 */ kvdByteLength: reader.readUInt(),
    /* UInt64 */ sgdByteOffset: reader.readLong(),
    /* UInt64 */ sgdByteLength: reader.readLong(),
  }
}

function readLevelIndex(reader: BinaryReader): LevelIndex {
  return {
    /* UInt64 */ byteOffset: reader.readLong(),
    /* UInt64 */ byteLength: reader.readLong(),
    /* UInt64 */ uncompressedByteLength: reader.readLong(),
  }
}

function readLevelImage(buffer: ArrayBuffer, ktx: File, level: number): LevelImage {
  const header = ktx.header
  const index = ktx.levelIndex[level]
  const dataType = surfaceFormatDataType(ktx.format)
  const ArrayType = dataTypeToArrayType(dataType)
  const layers: Array<{ faces: Uint8Array<ArrayBuffer>[] }> = []
  for (let l = 0; l < Math.max(1, header.layerCount); l++) {
    const faces: Uint8Array<ArrayBuffer>[] = []
    for (let i = 0; i < header.faceCount; i++) {
      const faceLength = index.byteLength / header.faceCount
      const faceOffset = index.byteOffset + faceLength * i
      const data = new ArrayType(buffer, faceOffset, faceLength / header.typeSize)
      faces.push(data as any)
    }
    layers.push({
      faces: faces,
    })
  }

  const divisor = Math.pow(2, level)
  return {
    width: header.pixelWidth / divisor,
    height: header.pixelHeight / divisor,
    layers: layers,
  }
}
export function parse(data: ArrayBuffer) {
  return new File(data)
}

export class File {
  public readonly header: Header
  public readonly index: Index
  public readonly levelIndex: Array<LevelIndex>
  public readonly levelImages: Array<LevelImage>
  public readonly format: SurfaceFormat
  public readonly isCompressed: boolean

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
    this.format = surfaceFormatFromVulkan(this.header.vkFormat)
    this.levelIndex = []
    this.levelImages = []
    this.isCompressed = !!this.header.supercompressionScheme

    if (this.isCompressed) {
      return
    }

    for (let i = 0; i < this.header.levelCount; i++) {
      this.levelIndex[i] = readLevelIndex(reader)
      this.levelImages[i] = readLevelImage(reader.data, this, i)
    }
  }
}
