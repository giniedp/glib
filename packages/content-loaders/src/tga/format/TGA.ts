import { BinaryReader } from '@gglib/utils'

export interface TgaHeader {
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

export interface TgaFooter {
  extensionOffset: number
  developerOffset: number
  signature: string
  reserved: string
  terminator: number
}

function readHeader(reader: BinaryReader): TgaHeader {
  reader.seekAbsolute(0)
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

function readFooter(reader: BinaryReader): TgaFooter {
  reader.seekAbsolute(reader.data.byteLength - 26)
  const footer = {
    extensionOffset: reader.readInt(),
    developerOffset: reader.readInt(),
    signature: reader.readString(16),
    reserved: reader.readString(1),
    terminator: reader.readByte(),
  }
  if (footer.signature !== 'TRUEVISION-XFILE') {
    return null
  }
  return footer
}

function decodeRunLengthData(reader: BinaryReader, pixelSize: number, dataSize: number): Uint8Array {
  let data = new Uint8Array(dataSize)
  let dataIndex = 0
  while (dataIndex < dataSize) {
    let byte = reader.readByte()
    let pixelCount = (byte & 0x7f) + 1

    if (byte & 0x80) {
      // Run length encoded pixel
      const fixed = reader.position
      for (let i = 0; i < pixelCount; i++) {
        reader.seekAbsolute(fixed)
        reader.readBuffer(data, dataIndex, pixelSize)
        dataIndex += pixelSize
      }
    } else {
      // Raw pixel
      reader.readBuffer(data, dataIndex, pixelCount * pixelSize)
      dataIndex += pixelCount * pixelSize
    }
  }
  return data
}

export class TGA {

  public static parse(data: any) {
    return new TGA().init(data).getImageData()
  }

  public header: TgaHeader
  public footer: TgaFooter

  public colorData: Uint8Array
  public imageData: Uint8Array

  get width() {
    return this.header.imageWidth
  }

  get height() {
    return this.header.imageHeight
  }

  get hasColorMap() {
    return (this.header.imageType & 0x3) === 0x1 // decimal 1 or 9
  }

  get isGray() {
    return (this.header.imageType & 0x3) === 0x3 // decimal 3 or 11
  }

  get isCompressed() {
    return (this.header.imageType & 0x8) === 0x8 // decimal 9, 10, 11
  }

  get isRightToLeft(): boolean {
    return ((this.header.imageDescriptor & 0x30 >> 0x4) & 0x1) === 0x1
  }

  get isBottomToTop(): boolean {
    return ((this.header.imageDescriptor & 0x30 >> 0x4) & 0x2) === 0x2
  }

  public init(data: any) {
    const reader = new BinaryReader(data)
    this.header = readHeader(reader)
    this.footer = readFooter(reader)

    reader.seekAbsolute(18 + this.header.idLength)

    if (this.hasColorMap) {
      const colorMapEntrySize = this.header.colorMapEntryDepth / 8
      const colorMapSize = this.header.colorMapLength * colorMapEntrySize
      const colorMapEnd = reader.position + colorMapSize
      this.colorData = new Uint8Array(reader.slice(colorMapEnd))
      reader.seekAbsolute(colorMapEnd)
    }

    const pixelSize = this.header.pixelDepth / 8
    const imageSize = (this.hasColorMap ? 1 : pixelSize) * this.header.imageWidth * this.header.imageHeight
    this.imageData = this.isCompressed
      ? decodeRunLengthData(reader, pixelSize, imageSize)
      : new Uint8Array(reader.slice(reader.position + imageSize))

    return this
  }

  private getImageData(): ImageData {
    let startX = this.header.imageStartX
    let endX = this.header.imageStartX + this.width
    let stepX = 1
    if (this.isRightToLeft) {
      startX = this.header.imageStartX + this.width
      endX = this.header.imageStartX
      stepX = -1
    }

    let startY = this.header.imageStartY
    let endY = this.header.imageStartY + this.height
    let stepY = 1
    if (this.isBottomToTop) {
      startY = this.header.imageStartY + this.height
      endY = this.header.imageStartY
      stepY = -1
    }

    const imageData = new ImageData(new Uint8ClampedArray(this.width * this.height * 4), this.width, this.height)

    const getPixel = this.getPixelFunc()
    for (let y = startY; y !== endY; y += stepY) {
      for (let x = startX; x !== endX; x += stepX) {
        getPixel(imageData.data, x, y)
      }
    }

    return imageData
  }

  private getPixelFunc() {
    if (this.header.pixelDepth === 8) {
      return this.isGray
        ? this.getPixel8Gray.bind(this)
        : this.getPixel8.bind(this)
    }

    if (this.header.pixelDepth === 16) {
      return this.isGray
        ? this.getPixel16Gray.bind(this)
        : this.getPixel16.bind(this)
    }

    if (this.header.pixelDepth === 24) {
      return this.getPixel24.bind(this)
    }

    if (this.header.pixelDepth === 32) {
      return this.getPixel32.bind(this)
    }
  }

  private getPixel8(target: number[], x: number, y: number) {
    const i = (x + (this.height - y) * this.width) * 4
    const j = (x + y * this.width)
    const color = this.imageData[j]
    target[i + 2] = this.colorData[(color * 3) + 0]
    target[i + 1] = this.colorData[(color * 3) + 1]
    target[i + 0] = this.colorData[(color * 3) + 2]
    target[i + 3] = 255
  }

  private getPixel8Gray(target: number[], x: number, y: number) {
    const i = (x + (this.height - y) * this.width) * 4
    const j = (x + y * this.width)
    const color = this.imageData[j]
    target[i + 0] = color
    target[i + 1] = color
    target[i + 2] = color
    target[i + 3] = 255
  }

  private getPixel16(target: number[], x: number, y: number) {
    const i = (x + (this.height - y) * this.width) * 4
    const j = (x + y * this.width) * 2
    const color = this.imageData[j + 0] | (this.imageData[j + 1] << 8)
    target[i + 0] = (color & 0x7C00) >> 7
    target[i + 1] = (color & 0x03E0) >> 2
    target[i + 2] = (color & 0x001F) >> 3
    target[i + 3] = (color & 0x8000) ? 0 : 255
  }

  private getPixel16Gray(target: number[], x: number, y: number) {
    const i = (x + (this.height - y) * this.width) * 4
    const j = (x + y * this.width) * 2
    const color = this.imageData[j]
    target[i + 0] = color
    target[i + 1] = color
    target[i + 2] = color
    target[i + 3] = 255
  }

  private getPixel24(target: number[], x: number, y: number) {
    const i = (x + (this.height - y) * this.width) * 4
    const j = (x + y * this.width) * 3
    target[i + 2] = this.imageData[j + 0]
    target[i + 1] = this.imageData[j + 1]
    target[i + 0] = this.imageData[j + 2]
    target[i + 3] = 255
  }

  private getPixel32(target: number[], x: number, y: number) {
    const i = (x + (this.height - y) * this.width) * 4
    const j = (x + y * this.width) * 4
    target[i + 2] = this.imageData[j + 0]
    target[i + 1] = this.imageData[j + 1]
    target[i + 0] = this.imageData[j + 2]
    target[i + 3] = this.imageData[j + 3]
  }
}
