import { ArrayType } from '@gglib/graphics'
import { BinaryReader } from '@gglib/utils'
import { VK_TO_GL1, VK_TO_GL2, VK_TO_GL2_WITH_EXT } from './VK2GL'

// KTX 1 Format: https://registry.khronos.org/KTX/specs/1.0/ktxspec.v1.html
// KTX 2 Format: https://registry.khronos.org/KTX/specs/2.0/ktxspec.v2.html
// Other links:
//  - https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
//  - https://www.khronos.org/registry/vulkan/specs/1.1-extensions/man/html/VkFormat.html
//  - https://github.com/KhronosGroup/KTX-Software
//  - https://www.khronos.org/registry/webgl/specs/latest/2.0/
//  - https://github.com/KhronosGroup/KTX-Specification/blob/master/formats.json

export interface V2Header {
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

export interface V2Index {
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

export interface FormatInfo {
  surfaceFormat: GLenum
  format: GLenum
  type: GLenum
}

function readHeader(reader: BinaryReader): V2Header {
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

function readIndex(reader: BinaryReader): V2Index {
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

  const layers: Array<{ faces: Uint8Array<ArrayBuffer>[] }> = []
  for (let l = 0; l < Math.max(1, header.layerCount); l++) {
    const faces: Uint8Array<ArrayBuffer>[] = []
    for (let i = 0; i < header.faceCount; i++) {
      const faceLength = index.byteLength / header.faceCount
      const faceOffset = index.byteOffset + faceLength * i
      const data = new ArrayType[ktx.glInfo.type](buffer, faceOffset, faceLength / header.typeSize)
      faces.push(data)
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
  public readonly header: V2Header
  public readonly index: V2Index
  public readonly levelIndex: Array<LevelIndex>
  public readonly levelImages: Array<LevelImage>
  public readonly glInfo: FormatInfo
  public readonly requiresWebgl2: boolean
  public readonly requiresExtension: string

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
    this.glInfo = VK_TO_GL1[this.header.vkFormat]
    if (!this.glInfo) {
      this.glInfo = VK_TO_GL2[this.header.vkFormat]
      this.requiresWebgl2 = !!this.glInfo
    }
    if (!this.glInfo) {
      const info = VK_TO_GL2_WITH_EXT[this.header.vkFormat]
      this.glInfo = info
      this.requiresWebgl2 = !!this.glInfo
      this.requiresExtension = info?.glExtension
    }

    const lvlIndex: LevelIndex[] = (this.levelIndex = [])
    const lvlImages: LevelImage[] = (this.levelImages = [])

    if (this.header.supercompressionScheme) {
      return
    }

    if (!this.glInfo) {
      console.error(`[KTX] vkFormat is not supported: ${this.header.vkFormat}`)
    }

    for (let i = 0; i < this.header.levelCount; i++) {
      lvlIndex[i] = readLevelIndex(reader)
      lvlImages[i] = readLevelImage(reader.data, this, i)
    }
  }
}
