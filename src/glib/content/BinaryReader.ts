module Glib.Content {

  export class BinaryReader {
    data:Uint8Array;
    position:number;

    constructor(data:Uint8Array) {
      this.data = data;
      this.position = 0;
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

    readByte():number {
      return this.data[this.position++];
    }

    readShort():number {
      return this.data[this.position++] | (this.data[this.position++] << 8);
    }

    readInt():number {
      return this.data[this.position++] | (this.data[this.position++] << 8) | (this.data[this.position++] << 16) | (this.data[this.position++] << 24);
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
