module Glib.Content {

  export class BinaryReader {
    data:Uint8Array
    view:DataView
    position:number

    constructor(data:Uint8Array) {
      this.data = data;
      this.view = new DataView(this.data.buffer)
      this.position = 0
    }

    get canRead() {
      return this.position < this.data.length;
    }

    readBytes(length:number):number[] {
      var output = [];
      while(length > 0) {
        output.push(this.data[this.position++]);
        length--;
      }
      return output;
    }

    readBuffer(buffer:number[]|Uint8Array, index:number, length:number) {
      var end = index + length;
      while(index < end) {
        buffer[index++] = this.data[this.position++];
      }
    }

    readUByte():number {
      return this.view.getUint8(this.position++)
    }
    readByte():number {
      return this.view.getInt8(this.position++)
    }

    readUShort():number {
      let result = this.view.getUint16(this.position, true)
      this.position += 2 
      return result
    }
    readShort():number {
      let result = this.view.getInt16(this.position, true)
      this.position += 2 
      return result
    }

    readUInt():number {
      let result = this.view.getUint32(this.position, true)
      this.position += 4
      return result
    }
    readInt():number {
      let result = this.view.getInt32(this.position, true)
      this.position += 4
      return result
    }

    seekAbsolute(position:number) {
      this.position = position;
    }

    seekRelative(position:number) {
      this.position += position;
    }

    readString(length:number):string {
      var result = [];
      while(length > 0) {
        result.push(String.fromCharCode(this.data[this.position++]));
        length--;
      }
      return result.join('');
    }
  }

}
