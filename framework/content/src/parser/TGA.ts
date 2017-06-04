// tslint:disable no-bitwise

import { BinaryReader } from '../BinaryReader'

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
  reader.seekAbsolute(reader.data.length - 26)
  let footer = {
    extensionOffset: reader.readInt(),
    developerOffset: reader.readInt(),
    signature: reader.readString(16),
    reserved: reader.readString(1),
    terminator: reader.readByte(),
  }
  if (footer.signature !== 'TRUEVISION XFILE') {
    return null
  }
  return footer
}

function decodeRunLengthData(reader: BinaryReader, pixelSize: number, dataSize: number): Uint8Array {
  let imageData = new Uint8Array(dataSize)
  let imagePos = 0
  let end = reader.position + dataSize
  while (reader.position < end) {
    let meta = reader.readByte()
    let count = (meta & 0x7f) + 1

    if (meta & 0x8) {
      // Run length encoded pixel
      let pixelPos = reader.position
      for (let i = 0; i < count; i++) {
        reader.seekAbsolute(pixelPos)
        reader.readBuffer(imageData, imagePos, pixelSize)
        imagePos += pixelSize
      }
    } else {
      // Raw pixel
      reader.readBuffer(imageData, imagePos, count * pixelSize)
      imagePos += count * pixelSize
    }
  }
  return imageData
}

function getImageData8bits(
  imageData: number[],
  indexes: number[],
  colormap: number[],
  width: number,
  yStart: number,
  yStep: number,
  yEnd: number,
  xStart: number,
  xStep: number,
  xEnd: number,
) {
  let color: number

  for (let i = 0, y = yStart; y !== yEnd; y += yStep) {
    for (let x = xStart; x !== xEnd; x += xStep, i++) {
      color = indexes[i]
      imageData[(x + width * y) * 4 + 3] = 255
      imageData[(x + width * y) * 4 + 2] = colormap[(color * 3) + 0]
      imageData[(x + width * y) * 4 + 1] = colormap[(color * 3) + 1]
      imageData[(x + width * y) * 4 + 0] = colormap[(color * 3) + 2]
    }
  }

  return imageData
}

export class TGA {

  public header: TgaHeader
  public footer: TgaFooter

  public colorData: Uint8Array
  public imageData: Uint8Array

  get hasColorMap() {
    return (this.header.imageType & 0x3) === 0x1 // decimal 1 or 9
  }

  get isCompressed() {
    return (this.header.imageType & 0x8) === 0x8
  }

  get isRightToLeft(): boolean {
    return false// (this.header.imageDescriptor & 0x30 >> 0x4) & 0x1 === 0x1;
  }

  get isBottomToTop(): boolean {
    return false// (this.header.imageDescriptor & 0x30 >> 0x4) & 0x2 === 0x2;
  }

  public parse(data: any) {

    let reader = new BinaryReader(new Uint8Array(data))
    this.header = readHeader(reader)
    this.footer = readFooter(reader)

    reader.seekAbsolute(18 + this.header.idLength)

    if (this.hasColorMap) {
      let colorMapEntrySize = this.header.colorMapEntryDepth / 8
      let colorMapSize = this.header.colorMapLength * colorMapEntrySize
      let colorMapEnd = reader.position + colorMapSize
      this.colorData = reader.data.subarray(reader.position, colorMapEnd)
      reader.seekAbsolute(colorMapEnd)
    }

    let pixelSize = this.header.pixelDepth / 8
    let imageSize = (this.hasColorMap ? 1 : pixelSize) * this.header.imageWidth * this.header.imageHeight
    if (this.isCompressed) {
      this.imageData = decodeRunLengthData(reader, pixelSize, imageSize)
    } else {
      this.imageData = data.subarray(reader.position, reader.position * imageSize)
    }
  }

  private getImageData() {
    let spec = {
      startX: this.header.imageStartX,
      startY: this.header.imageStartY,
      endX: this.header.imageStartX + this.header.imageWidth,
      endY: this.header.imageStartY + this.header.imageHeight,
      stepX: 1,
      stepY: 1,
    }
    if (this.isRightToLeft) {
      spec.startX = spec.endX
      spec.endX = this.header.imageStartX
      spec.stepX = -1
    }
    if (this.isBottomToTop) {
      spec.startY = spec.endY
      spec.endY = this.header.imageStartY
      spec.stepY = -1
    }
  }
}
