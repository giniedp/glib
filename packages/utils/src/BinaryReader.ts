/**
 * @public
 */
export class BinaryReader {
  public data: ArrayBuffer
  public view: DataView
  public position: number
  public littleEndian = true

  constructor(data: ArrayBuffer) {
    this.data = data
    this.view = new DataView(this.data)
    this.position = 0
  }

  get canRead() {
    return this.position < this.data.byteLength
  }

  public readBytes(length: number): number[] {
    let output = []
    while (length > 0) {
      output.push(this.view.getUint8(this.position++))
      length--
    }
    return output
  }

  public readByteArray(length: number): Int8Array {
    return new Int8Array(this.slice(length))
  }

  public readBuffer(buffer: number[]|Uint8Array, index: number, length: number) {
    let end = index + length
    while (index < end) {
      buffer[index++] = this.view.getUint8(this.position++)
    }
  }

  public readUByte(): number {
    return this.view.getUint8(this.position++)
  }
  public readByte(): number {
    return this.view.getInt8(this.position++)
  }

  public readUShort(): number {
    let result = this.view.getUint16(this.position, this.littleEndian)
    this.position += 2
    return result
  }
  public readShort(): number {
    let result = this.view.getInt16(this.position, this.littleEndian)
    this.position += 2
    return result
  }

  public readUInt(): number {
    let result = this.view.getUint32(this.position, this.littleEndian)
    this.position += 4
    return result
  }

  public readInt(): number {
    let result = this.view.getInt32(this.position, this.littleEndian)
    this.position += 4
    return result
  }

  public readLong(): number {
    let lo = String(this.view.getUint32(this.position, this.littleEndian))
    let hi = String(this.view.getUint32(this.position, this.littleEndian))
    while (hi.length < 10) {
      hi = '0' + hi
    }
    this.position += 8
    return parseFloat(hi + lo)
  }

  public readFloat(): number {
    let result = this.view.getFloat32(this.position, this.littleEndian)
    this.position += 4
    return result
  }

  public readDouble(): number {
    let result = this.view.getFloat64(this.position, this.littleEndian)
    this.position += 8
    return result
  }

  public seekAbsolute(position: number) {
    this.position = position
  }

  public seekRelative(position: number) {
    this.position += position
  }

  public readString(length: number): string {
    let result = []
    while (length > 0) {
      result.push(String.fromCharCode(this.view.getUint8(this.position++)))
      length--
    }
    return result.join('')
  }

  public slice(length: number): ArrayBuffer {
    this.position += length
    return this.data.slice(this.position - length, this.position)
  }
}

export default BinaryReader
