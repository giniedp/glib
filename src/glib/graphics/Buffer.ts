module Glib.Graphics {

  export interface BufferData {
    length:number,
    [index:number]: number,
    push(value:number)
  }

  export interface BufferOptions {
    type?: string|number,
    usage?: string|number,
    layout?: any,
    dataType?: string|number,
    data?: BufferData,
    handle?: WebGLBuffer
  }

  export class Buffer {
    device:Device;
    gl:any;
    handle:WebGLBuffer;
    type:number;
    dataType:number;
    usage:number;
    dataSize:number;
    dataLength:number;
    elementSize:number;
    elementCount:number;
    layout:Object;

    constructor(device:Device, opts?:BufferOptions) {

      this.device = device;
      this.gl = device.context;

      this.setup(opts || {});
    }

    get typeName():string {
      return BufferTypeName[this.type];
    }

    get usageName():string {
      return BufferUsageName[this.usage];
    }

    get dataTypeName():string {
      return DataTypeName[this.dataType];
    }

    setup(opts:BufferOptions):Buffer {
      if (opts.handle) {
        this.destroy();
        this.handle = opts.handle;
      }
      if (!this.handle || !this.gl.isBuffer(this.handle)) {
        this.handle = this.gl.createBuffer();
      }

      this.usage = (BufferUsage[opts.usage] || this.usage || BufferUsage.Static);
      if (!this.usageName) {
        utils.log('invalid buffer usage', this.usage, this, opts);
      }

      this.type = (BufferType[opts.type] || this.type);
      if (!this.typeName) {
        utils.log('invalid buffer type', this.type, this, opts);
      }

      this.dataType = (DataType[opts.dataType] || this.dataType || DataType.float);
      if (!this.dataTypeName) {
        utils.log('invalid buffer dataType', this.dataType, this, opts);
      }

      this.elementSize = DataSize[this.dataType];

      if (opts.layout) {
        this.layout = opts.layout;
        this.elementSize = VertexLayout.countBytes(this.layout);
      }

      if (opts.data) {
        this.setData(opts.data);
      }
      return this;
    }

    destroy():Buffer {
      if (this.gl.isBuffer(this.handle)) {
        this.gl.deleteBuffer(this.handle);
        this.handle = null;
      }
      return this;
    }

    use():Buffer {
      if (this.type === BufferType.VertexBuffer) {
        this.device.vertexBuffer = this;
      } else if (this.type === BufferType.IndexBuffer) {
        this.device.indexBuffer = this;
      } else {
        // TODO: log error
      }
      return this;
    }

    useProgram(program:ShaderProgram):Buffer {
      this.use();
      var key, channel, attribute;
      for (key in program.attributes) { // jshint ignore:line
        channel = this.layout[key];
        attribute = program.attributes[key];
        if (channel) {
          this.gl.vertexAttribPointer(attribute.location, channel.elements, DataType[channel.type], !!channel.normalize, this.elementSize, channel.offset);
        }
      }
      return this;
    }

    setData(data:BufferData):Buffer {
      if (data instanceof Array) {
        data = new ArrayType[this.dataType](data);
      }

      this.use();
      this.gl.bufferData(this.type, data, this.usage);

      this.dataLength = data.length;
      this.dataSize = this.dataLength * DataSize[this.dataType];
      this.elementCount = this.dataSize / this.elementSize;
      return this;
    }

    setSubData(data:BufferData, index?:number):Buffer {
      if (data instanceof Array) {
        data = new ArrayType[this.dataType](data);
      }
      index = index || 0;
      this.use();
      this.gl.bufferSubData(this.type, index * this.elementSize, data);

      this.dataLength = Math.max(data.length, index + data.length);
      this.dataSize = this.dataLength * DataSize[this.dataType];
      this.elementCount = this.dataSize / this.elementSize;
      return this;
    }
  }
}
