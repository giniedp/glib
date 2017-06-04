export class BinaryReader {
  public data: Uint8Array
  public view: DataView
  public position: number

  constructor(data: Uint8Array) {
    this.data = data
    this.view = new DataView(this.data.buffer)
    this.position = 0
  }

  get canRead() {
    return this.position < this.data.length
  }

  public readBytes(length: number): number[] {
    let output = []
    while (length > 0) {
      output.push(this.data[this.position++])
      length--
    }
    return output
  }

  public readBuffer(buffer: number[]|Uint8Array, index: number, length: number) {
    let end = index + length
    while (index < end) {
      buffer[index++] = this.data[this.position++]
    }
  }

  public readUByte(): number {
    return this.view.getUint8(this.position++)
  }
  public readByte(): number {
    return this.view.getInt8(this.position++)
  }

  public readUShort(): number {
    let result = this.view.getUint16(this.position, true)
    this.position += 2
    return result
  }
  public readShort(): number {
    let result = this.view.getInt16(this.position, true)
    this.position += 2
    return result
  }

  public readUInt(): number {
    let result = this.view.getUint32(this.position, true)
    this.position += 4
    return result
  }

  public readInt(): number {
    let result = this.view.getInt32(this.position, true)
    this.position += 4
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
      result.push(String.fromCharCode(this.data[this.position++]))
      length--
    }
    return result.join('')
  }
}
