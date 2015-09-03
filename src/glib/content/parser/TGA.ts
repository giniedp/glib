module Glib.Content.Parser {

  export interface TgaHeader {
    idLength: number;
    colorMapType:number;
    imageType:number;
    colorMapFirstIndex:number;
    colorMapLength:number;
    colorMapEntryDepth:number;
    imageStartX:number;
    imageStartY:number;
    imageWidth:number;
    imageHeight:number;
    pixelDepth:number;
    imageDescriptor:number;
  }

  export interface TgaFooter {
    extensionOffset:number;
    developerOffset:number;
    signature:string;
    reserved:string;
    terminator:number;
  }

  function readHeader(reader:BinaryReader){
    reader.seekAbsolute(0);
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
      imageDescriptor: reader.readByte()
    }
  }

  function readFooter(reader:BinaryReader) {
    reader.seekAbsolute(reader.data.length - 26);
    var footer = {
      extensionOffset: reader.readInt(),
      developerOffset: reader.readInt(),
      signature: reader.readString(16),
      reserved: reader.readString(1),
      terminator: reader.readByte()
    };
    if (footer.signature !== 'TRUEVISION XFILE') {
      return null;
    }
    return footer;
  }

  function decodeRunLengthData(reader:BinaryReader, pixelSize, dataSize):Uint8Array {
    var imageData = new Uint8Array(dataSize);
    var imagePos = 0;
    var end = reader.position + dataSize;
    while(reader.position < end) {
      var meta = reader.readByte();
      var count = (meta & 0x7f) + 1;

      if (meta & 0x8) {
        // Run length encoded pixel
        var pixelPos = reader.position;
        for (var i = 0; i < count; i++) {
          reader.seekAbsolute(pixelPos);
          reader.readBuffer(imageData, imagePos, pixelSize);
          imagePos += pixelSize;
        }
      } else {
        // Raw pixel
        reader.readBuffer(imageData, imagePos, count * pixelSize);
        imagePos += count * pixelSize;
      }
    }
    return imageData;
  }

  export class TGA {

    header: TgaHeader;
    footer: TgaFooter;

    colorMapData:Uint8Array;
    imageData:Uint8Array;

    get hasColorMap() {
      return (this.header.imageType & 0x3) === 0x1; // decimal 1 or 9
    }

    get isCompressed() {
      return (this.header.imageType & 0x8) === 0x8;
    }

    get isRightToLeft():boolean {
      return false// (this.header.imageDescriptor & 0x30 >> 0x4) & 0x1 === 0x1;
    }

    get isBottomToTop():boolean {
      return false//(this.header.imageDescriptor & 0x30 >> 0x4) & 0x2 === 0x2;
    }

    parse(data) {
      var reader = new Content.BinaryReader(new Uint8Array(data));
      this.header = readHeader(reader);
      this.footer = readFooter(reader);

      reader.seekAbsolute(18 + this.header.idLength);

      if (this.hasColorMap) {
        var colorMapEntrySize = this.header.colorMapEntryDepth / 8;
        var colorMapSize = this.header.colorMapLength * colorMapEntrySize;
        var colorMapEnd = reader.position + colorMapSize;
        this.colorMapData = reader.data.subarray(reader.position, colorMapEnd);
        reader.seekAbsolute(colorMapEnd);
      }

      var pixelSize = this.header.pixelDepth / 8;
      var imageSize = (this.hasColorMap ? 1 : pixelSize) * this.header.imageWidth * this.header.imageHeight;
      if (this.isCompressed) {
        this.imageData = decodeRunLengthData(reader, pixelSize, imageSize);
      } else {
        this.imageData = data.subarray(reader.position, reader.position * imageSize);
      }
    }

    getImageData() {
      var spec = {
        startX: this.header.imageStartX,
        startY: this.header.imageStartY,
        endX: this.header.imageStartX + this.header.imageWidth,
        endY: this.header.imageStartY + this.header.imageHeight,
        stepX: 1,
        stepY: 1
      };
      if (this.isRightToLeft) {
        spec.startX = spec.endX;
        spec.endX = this.header.imageStartX;
        spec.stepX = -1;
      }
      if (this.isBottomToTop) {
        spec.startY = spec.endY;
        spec.endY = this.header.imageStartY;
        spec.stepY = -1;
      }
    }
  }
}
