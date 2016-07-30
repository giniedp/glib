module Glib.Graphics {

  export interface BufferData {
    length:number,
    [index:number]: number,
    push(value:number)
  }

  export interface BufferOptions {
    handle?: WebGLBuffer,
    type?: string|number,
    usage?: string|number,
    layout?: any,
    data?: BufferData,
    dataType?: string|number,
    elementSize?: number
  }

  export class Buffer {
    device:Device;
    gl:any;
    handle:WebGLBuffer;
    type:number;
    dataType:number;
    usage:number;
    dataSize:number;
    //dataLength:number;
    elementSize:number;
    elementCount:number;
    layout:Object;

    constructor(device:Device, opts?:BufferOptions) {
      this.device = device;
      this.gl = device.context;
      this.setup(opts || {});
    }

    // Translates and returns the current 'type' property to a readable name.
    // Result is one of [ARRAY_BUFFER|ELEMENT_ARRAY_BUFFER]
    // This property exists purely for debugging
    get typeName():string {
      return BufferTypeName[this.type];
    }

    // Translates and returns the current 'usage' property to a readable name.
    // Result is one of [STATIC_DRAW|DYNAMIC_DRAW|STREAM_DRAW]
    // This property exists purely for debugging
    get usageName():string {
      return BufferUsageName[this.usage];
    }

    // Translates and returns the current 'dataType' property to a readable name.
    // This property exists purely for debugging
    get dataTypeName():string {
      return DataTypeName[this.dataType];
    }

    // Indicates whether this buffer is setup as an IndexBuffer
    get isIndexBuffer():Boolean {
      return this.type === BufferType.IndexBuffer
    }
    // Indicates whether this buffer is setup as an VertexBuffer
    get isVertexBuffer():Boolean {
      return this.type === BufferType.VertexBuffer
    }

    setup(opts:BufferOptions):Buffer {
      if (opts.handle) {
        this.destroy();
        this.handle = opts.handle;
      }
      if (!this.handle || !this.gl.isBuffer(this.handle)) {
        this.handle = this.gl.createBuffer();
      }

      // must be one of [Static|Dynamic|Stream]
      if (opts.usage) {
        this.usage = BufferUsage[opts.usage]
      } else {
        this.usage = this.usage || BufferUsage.Static
      }
      if (!this.usageName) {
        utils.warn('[Buffer]', `invalid 'usage' option`, opts);
      }

      // must be one of [VertexBufferIndexBuffer]
      if (opts.type) {
        this.type = BufferType[opts.type]
      } else {
        this.type = this.type || BufferType.IndexBuffer
      }
      if (!this.typeName) {
        utils.warn('[Buffer]', `invalid or missing 'type' option`, opts);
        this.type = BufferType.IndexBuffer
      }

      if (opts.dataType) {
        this.dataType = DataType[opts.dataType]
        this.elementSize = opts.elementSize || DataSize[opts.dataType]
      } else if (this.isIndexBuffer) {
        this.dataType = DataType.UNSIGNED_SHORT
        this.elementSize = DataSize.UNSIGNED_SHORT
      } else {
        this.dataType = DataType.FLOAT
        this.elementSize = DataSize.FLOAT
      }
      if (opts.layout) {
        this.layout = opts.layout
        this.dataType = DataType.UNSIGNED_BYTE
        this.elementSize = VertexLayout.countBytes(this.layout)
      }
      if (!this.dataTypeName) {
        utils.warn('[Buffer]', `invalid 'dataType' option`, opts);
      }

      if (opts.data) {
        this.setData(opts.data);
      }
      return this;
    }

    // Releases any graphics resouces.
    destroy():Buffer {
      if (this.gl.isBuffer(this.handle)) {
        this.gl.deleteBuffer(this.handle);
        this.handle = null;
      }
      return this;
    }

    // Sets this buffer on the graphics device as current vertex or index buffer
    // depending on the 'type' property
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
      for (key in program.attributes) {
        channel = this.layout[key];
        attribute = program.attributes[key];
        if (channel) {
          this.gl.vertexAttribPointer(attribute.location, channel.elements, DataType[channel.type], !!channel.normalize, this.elementSize, channel.offset);
        }
      }
      return this;
    }

    setData(data:any):Buffer {
      if (this.isIndexBuffer) {
        let buffer: ArrayBuffer
        if (data instanceof Array) {
          buffer = new ArrayType[this.dataType](data).buffer;
        } else if (data instanceof ArrayBuffer) {
          buffer = data as any
        } else if (data instanceof ArrayType[this.dataType]) {
          buffer = data.buffer
        } 
        if (!buffer) {
          throw `invalid argument 'data'. must be one of [number[]|${ArrayTypeName[this.dataType]}|ArrayBuffer]`
        }
        
        this.use();
        this.gl.bufferData(this.type, buffer, this.usage);

        this.dataSize = buffer.byteLength;
        this.elementCount = this.dataSize / this.elementSize;
      } else {
        let buffer: ArrayBuffer
        if (data instanceof Array) {
          buffer = VertexLayout.convertArrayArrayBuffer(data, this.layout)
        } else if (data instanceof ArrayBuffer) {
          buffer = data as any
        } else if (data.buffer instanceof ArrayBuffer) {
          buffer = data.buffer
        } 
        if (!buffer) {
          throw `invalid argument 'data'. must be one of [number[]|TypedArray|ArrayBuffer]`
        }

        this.use()
        this.gl.bufferData(this.type, buffer, this.usage)
 
        this.dataSize = buffer.byteLength
        this.elementCount = this.dataSize / this.elementSize;
      }
      return this;
    }

    setSubData(data:BufferData, elementOffset?:number):Buffer {
      if (data instanceof Array) {
        data = new ArrayType[this.dataType](data);
      }
      elementOffset = elementOffset || 0;
      this.use();
      this.gl.bufferSubData(this.type, elementOffset * this.elementSize, data);

      // TODO: check implementation of dataLength calculation
      let length = Math.max(data.length, elementOffset + data.length); 
      this.dataSize = length * DataSize[this.dataType];
      this.elementCount = this.dataSize / this.elementSize;
      return this;
    }    
  }

}
