import { BinaryReader } from '@gglib/utils'
import { GLConst, TextureOptions } from '@gglib/graphics'

export interface TGAHeader {
  idLength: number
  colorMapType: number
  imageType: number
  colorMapFirstIndex: number
  colorMapLength: number
  colorMapEntryDepth: number
  imageStartX: number
  imageStartY: number
  imageWidth: number
  imageHeight: number
  pixelDepth: number
  imageDescriptor: number
}

function readHeader(reader: BinaryReader): TGAHeader {
  return {
    idLength: reader.readByte(),
    colorMapType: reader.readByte(),
    imageType: reader.readByte(),
    colorMapFirstIndex: reader.readShort(),
    colorMapLength: reader.readShort(),
    colorMapEntryDepth: reader.readByte(),
    imageStartX: reader.readShort(),
    imageStartY: reader.readShort(),
    imageWidth: reader.readShort(),
    imageHeight: reader.readShort(),
    pixelDepth: reader.readByte(),
    imageDescriptor: reader.readByte(),
  }
}

function decodeRunLengthData(reader: BinaryReader, pixelSize: number, dataSize: number): Uint8Array {
  const result = new Uint8Array(dataSize)
  let dataIndex = 0
  while (dataIndex < dataSize) {
    const byte = reader.readByte()
    const pixelCount = (byte & 0x7f) + 1
    if (byte & 0x80) {
      // Run length encoded pixel
      const fixed = reader.position
      for (let i = 0; i < pixelCount; i++) {
        reader.seekAbsolute(fixed)
        reader.readBuffer(result, dataIndex, pixelSize)
        dataIndex += pixelSize
      }
    } else {
      // Raw pixel
      reader.readBuffer(result, dataIndex, pixelCount * pixelSize)
      dataIndex += pixelCount * pixelSize
    }
  }
  return result
}

export class TGA {
  public static parse(data: ArrayBuffer) {
    return new TGA(data).getImageData()
  }

  /**
   * Parsed TGA header
   */
  public readonly header: TGAHeader
  /**
   * Color lookup table
   */
  public readonly colorMap: Uint8Array | null
  /**
   * Pixel data
   */
  public readonly imageData: Uint8Array
  /**
   * Width of the texture
   */
  public readonly width: number
  /**
   * Height of the texture
   */
  public readonly height: number
  /**
   * Specifies whether this is a grayscale image
   */
  public readonly isGray: boolean
  /**
   * Bytes per pixel in the color map
   */
  public readonly colorMapStride: number

  /**
   * Interprets the given array buffer as TGA formatted image
   *
   * @param data - the tga data buffer
   */
  public constructor(data: ArrayBuffer) {
    const reader = new BinaryReader(data)
    const header = (this.header = readHeader(reader))
    const width = (this.width = this.header.imageWidth)
    const height = (this.height = this.header.imageHeight)

    const hasColorMap = (header.imageType & 0x3) === 0x1
    const isCompressed = (header.imageType & 0x8) === 0x8
    this.isGray = (header.imageType & 0x3) === 0x3

    reader.seekAbsolute(18 + header.idLength)
    if (hasColorMap) {
      this.colorMapStride = Math.ceil(header.colorMapEntryDepth / 8)
      this.colorMap = reader.subarray(Uint8Array, header.colorMapLength * this.colorMapStride)
    }

    const pixelSize = header.pixelDepth / 8
    const imageSize = (hasColorMap ? 1 : pixelSize) * width * height
    this.imageData = isCompressed
      ? decodeRunLengthData(reader, pixelSize, imageSize)
      : reader.subarray(Uint8Array, imageSize)
  }

  private loop(stride: number, fn: (iIn: number, iOut: number) => void) {
    let startX = this.header.imageStartX
    let endX = this.header.imageStartX + this.width
    let stepX = 1
    const isRightToLeft = (this.header.imageDescriptor & 0b010000) === 0b010000
    const isBottomToTop = (this.header.imageDescriptor & 0b100000) === 0b100000
    if (isRightToLeft) {
      ;[startX, endX] = [endX - 1, startX - 1]
      stepX = -1
    }

    let startY = this.header.imageStartY
    let endY = this.header.imageStartY + this.height
    let stepY = 1
    if (!isBottomToTop) {
      ;[startY, endY] = [endY - 1, startY - 1]
      stepY = -1
    }

    const byteStride = Math.ceil(this.header.pixelDepth / 8)
    let iOut = 0
    for (let y = startY; y !== endY; y += stepY) {
      for (let x = startX; x !== endX; x += stepX) {
        fn((x + y * this.width) * byteStride, iOut)
        iOut += stride
      }
    }
  }

  private loopColorMapped(stride: number, fn: (iIn: number, iOut: number) => void) {
    this.loop(stride, (iIn, iOut) => {
      fn(this.imageData[iIn] * this.colorMapStride, iOut)
    })
  }

  /**
   * Reads TGA data and converts to RGBA ImageData (8bit per channel)
   */
  public getImageData(): ImageData {
    let data: Uint8ClampedArray
    const format = 'ui8888'
    switch (this.header.pixelDepth) {
      case 8:
        if (this.isGray) {
          data = this.decode_gray8(format)
        } else if (this.colorMap) {
          data = this.decode_cm8(format)
        } else {
          throw new Error('invalid format')
        }
        break
      case 16:
        if (this.isGray) {
          data = this.decode_gray16(format)
        } else {
          data = this.decode_rgba16(format)
        }
        break
      case 24:
        data = this.decode_rgb24(format)
        break
      case 32:
        data = this.decode_rgba32(format)
        break
      default:
        throw new Error('invalid format')
    }

    return Object.assign(new ImageData(data, this.width, this.height), {
      tgaHeader: this.header,
    })
  }

  public getTextureOptions(): TextureOptions {
    const pixelDepth = this.header.pixelDepth
    if (this.isGray) {
      if (pixelDepth === 8) {
        return {
          source: this.decode_gray8('ui8'),
          // TODO: R8 with RED is invalid in webgl 2, why?
          pixelFormat: 'LUMINANCE',
          pixelType: 'uint8',
          width: this.width,
          height: this.height
        }
      }
      if (pixelDepth === 16) {
        return {
          source: this.decode_gray16('f32'),
          surfaceFormat: 'R32F',
          pixelFormat: 'RED',
          pixelType: 'float32',
          width: this.width,
          height: this.height
        }
      }
      throw new Error('whopsie') // TODO:
    }
    if (this.colorMap && pixelDepth === 8) {
      switch (this.colorMapStride) {
        case 2:
          return {
            source: this.decode_cm8('i5551'),
            pixelFormat: 'RGBA',
            pixelType: 'uint16_5_5_5_1',
            width: this.width,
            height: this.height
          }
        case 3:
          return {
            source: this.decode_cm8('ui888'),
            pixelFormat: 'RGB',
            pixelType: 'uint8',
            width: this.width,
            height: this.height
          }
        case 4:
          return {
            source: this.decode_cm8('ui8888'),
            pixelFormat: 'RGBA',
            pixelType: 'uint8',
            width: this.width,
            height: this.height
          }
      }
    }
    if (pixelDepth === 16) {
      return {
        source: this.decode_rgba16('i5551'),
        pixelFormat: 'RGBA',
        pixelType: 'uint16_5_5_5_1',
        width: this.width,
        height: this.height
      }
    }
    if (pixelDepth === 24) {
      return {
        source: this.decode_rgb24('ui888'),
        pixelFormat: 'RGB',
        pixelType: 'uint8',
        width: this.width,
        height: this.height
      }
    }
    if (pixelDepth === 32) {
      return {
        source: this.decode_rgba32('ui8888'),
        pixelFormat: 'RGBA',
        pixelType: 'uint8',
        width: this.width,
        height: this.height
      }
    }
    throw new Error('whopsie') // TODO:
  }

  /**
   * Decodes 8bit grayscale {@link imageData} into given format
   */
  public decode_gray8(format: 'ui8888' | 'ui888' | 'ui8') {
    const stride = strideOf(format)
    const output = new Uint8ClampedArray(this.width * this.height * stride).fill(255)
    this.loop(stride, (iIn, iOut) => {
      const value = this.imageData[iIn]
      output[iOut + 0] = value
      if (stride >= 2) {
        output[iOut + 1] = value
      }
      if (stride >= 3) {
        output[iOut + 2] = value
      }
    })
    return output
  }

  /**
   * Decodes 16bit rgba {@link imageData} into given format
   */
  public decode_rgba16(format: 'i5551'): Uint16Array
  public decode_rgba16(format: 'ui8888' | 'ui888'): Uint8ClampedArray
  public decode_rgba16(format: 'ui8888' | 'ui888' | 'i5551') {
    const input = this.imageData
    if (format === 'i5551') {
      const output = new Uint16Array(this.width * this.height)
      this.loop(1, (iIn, iOut) => {
        const c = (input[iIn] | (input[iIn + 1] << 8))
        output[iOut] = (c << 1) | ((c & 0b1_00000_00000_00000) >> 15)
      })
      return output
    }
    const stride = strideOf(format)
    const output = new Uint8ClampedArray(this.width * this.height * stride)//.fill(255)
    const scale5to8bit = 0b11111111 / 0b11111
    this.loop(stride, (iIn, iOut) => {
      const c = input[iIn] | (input[iIn + 1] << 8)
      output[iOut + 2] = ((c & 0b0_00000_00000_11111) >> 0) * scale5to8bit
      output[iOut + 1] = ((c & 0b0_00000_11111_00000) >> 5) * scale5to8bit
      output[iOut + 0] = ((c & 0b0_11111_00000_00000) >> 10) * scale5to8bit
      if (stride >= 4) {
        output[iOut + 3] = c & 0b1_00000_00000_00000 ? 255 : 0
      }
    })
    return output
  }

  /**
   * Decodes 16bit grayscale {@link imageData} into given format
   */
  public decode_gray16(format: 'ui16'): Uint16Array
  /**
   * Decodes 16bit grayscale {@link imageData} into given format
   */
  public decode_gray16(format: 'f16' | 'f32'): Float32Array
  /**
   * Decodes 16bit grayscale {@link imageData} into given format
   */
  public decode_gray16(format: 'ui8888' | 'ui888'): Uint8ClampedArray
  public decode_gray16(format: 'ui8888' | 'ui888' | 'f16' | 'f32' | 'ui16') {
    const input = this.imageData
    switch (format) {
      case 'ui16': {
        const output = new Uint16Array(this.width * this.height)
        this.loop(1, (iIn, iOut) => {
          output[iOut] = input[iIn + 0] | (input[iIn + 1] << 8)
        })
        return output
      }
      case 'f16':
      case 'f32': {
        const output = new Float32Array(this.width * this.height)
        this.loop(1, (iIn, iOut) => {
          output[iOut] = input[iIn + 0] | (input[iIn + 1] << 8)
        })
        return output
      }
      case 'ui888':
      case 'ui8888': {
        const stride = strideOf(format)
        const input = this.imageData
        const output = new Uint8ClampedArray(this.width * this.height * stride).fill(255)
        this.loop(stride, (iIn, iOut) => {
          const color = input[iIn + 0] | (input[iIn + 1] << 8)
          output[iOut + 0] = color / 0b11111111_11111111
          output[iOut + 1] = color / 0b11111111_11111111
          output[iOut + 2] = color / 0b11111111_11111111
        })
        return output
      }
      default:
        throw new Error('invalid')
    }
  }

  /**
   * Decodes 24bit rgb {@link imageData} into given format
   */
  public decode_rgb24(format: 'ui8888' | 'ui888') {
    const stride = strideOf(format)
    const input = this.imageData
    const output = new Uint8ClampedArray(this.width * this.height * stride).fill(255)
    this.loop(stride, (iIn, iOut) => {
      output[iOut + 2] = input[iIn + 0]
      output[iOut + 1] = input[iIn + 1]
      output[iOut + 0] = input[iIn + 2]
    })
    return output
  }

  /**
   * Decodes 32bit rgba {@link imageData} into given format
   */
  public decode_rgba32(format: 'ui8888' | 'ui888') {
    const stride = strideOf(format)
    const input = this.imageData
    const output = new Uint8ClampedArray(this.width * this.height * stride)
    this.loop(stride, (iIn, iOut) => {
      output[iOut + 2] = input[iIn + 0]
      output[iOut + 1] = input[iIn + 1]
      output[iOut + 0] = input[iIn + 2]
      if (stride >= 4) {
        output[iOut + 3] = input[iIn + 3]
      }
    })
    return output
  }

  /**
   * Decodes color mapped {@link imageData} into `i5551` format
   *
   * @remarks {@link colorMapStride} must be equal `2` otherwise error is thrown
   */
  public decode_cm8(format: 'i5551'): Uint16Array
  /**
   * Decodes color mapped {@link imageData} into given format
   */
  public decode_cm8(format: 'ui8888' | 'ui888'): Uint8ClampedArray
  public decode_cm8(format: 'ui8888' | 'ui888' | 'i5551') {
    if (this.colorMapStride === 2) {
      if (format === 'i5551') {
        const output = new Uint16Array(this.width * this.height)
        this.loopColorMapped(1, (iIn, iOut) => {
          const c = (this.colorMap[iIn] | (this.colorMap[iIn + 1] << 8))
          output[iOut] = (c << 1) | ((c & 0b1_00000_00000_00000) >> 15)
        })
        return output
      }
    }
    if (format === 'i5551') {
      throw new Error(`requested invalid format ${format}`)
    }

    const stride = strideOf(format)
    const output = new Uint8ClampedArray(this.width * this.height * stride).fill(255)
    if (this.colorMapStride === 2) {
      const scale5to8bit = 0b11111111 / 0b11111
      this.loopColorMapped(stride, (iIn, iOut) => {
        const b0 = this.colorMap[iIn + 0]
        const b1 = this.colorMap[iIn + 1]
        const color = b0 | (b1 << 8)
        output[iOut + 0] = ((color & 0b0_11111_00000_00000) >> 10) * scale5to8bit
        output[iOut + 1] = ((color & 0b0_00000_11111_00000) >> 5) * scale5to8bit
        output[iOut + 2] = ((color & 0b0_00000_00000_11111) >> 0) * scale5to8bit
        if (stride >= 4) {
          output[iOut + 3] = color & 0b1_00000_00000_00000 ? 255 : 0
        }
      })
      return output
    }
    const hasAndWantsAlpha = this.colorMapStride === 4 && stride === 4
    this.loopColorMapped(stride, (iIn, iOut) => {
      output[iOut + 2] = this.colorMap[iIn + 0]
      output[iOut + 1] = this.colorMap[iIn + 1]
      output[iOut + 0] = this.colorMap[iIn + 2]
      if (hasAndWantsAlpha) {
        output[iOut + 3] = this.colorMap[iIn + 3]
      }
    })
    return output
  }
}

const formatStride = {
  ui8888: 4,
  ui888: 3,
  ui88: 2,
  ui8: 1,
  i5551: 2,
}

function strideOf(format: 'ui8888' | 'ui888' | 'ui88' | 'ui8'): number {
  if (format in formatStride) {
    return formatStride[format]
  }
  throw new Error(`requested unknown format ${format}`)
}
