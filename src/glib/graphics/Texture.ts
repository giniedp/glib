module Glib.Graphics {

  var defaultPixel = new Uint8Array([128, 128, 128, 255]);

  export interface TextureOptions {
    generateMipmap?: boolean,
    pixelFormat?: number,
    pixelType?: number,
    type?: number,
    handle?: WebGLTexture,
    width?:number,
    height?:number,
    data?: any,
  }

  export class Texture {
    device:Device;
    gl:any;
    width:number = 0;
    height:number = 0;
    ready:boolean = false;
    isPOT:boolean = false;
    generateMipmap:boolean = false;
    pixelFormat:number = PixelFormat.RGBA;
    pixelType:number = DataType.ubyte;
    type:number = TextureType.Texture2D;
    update:()=> void = function () {
    };
    handle:WebGLTexture = null;

    constructor(device:Device, opts?:TextureOptions) {
      this.device = device;
      this.gl = device.context;
      this.setup(opts);
    }

    get pixelFormatName():number {
      return PixelFormatName[this.pixelFormat];
    }

    get pixelTypeName():number {
      return DataTypeName[this.pixelType];
    }

    get typeName():number {
      return TextureTypeName[this.type];
    }

    static videoTypes = ['mp4', 'ogv', 'ogg'];

    static createImageUpdateHandle(texture:Texture, image:HTMLImageElement) {
      var gl = texture.gl;
      return function () {
        texture.ready = (!!image.naturalWidth && !!image.naturalHeight);

        if (!texture.ready) {
          // image has not been downloaded yet
          return;
        }

        texture.use();
        gl.texImage2D(texture.type, 0, texture.pixelFormat, texture.pixelFormat, texture.pixelType, image);
        if (texture.generateMipmap) {
          gl.generateMipmap(texture.type);
        }

        texture.width = image.naturalWidth;
        texture.height = image.naturalHeight;
        texture.isPOT = utils.isPowerOfTwo(texture.width) && utils.isPowerOfTwo(texture.height);
        texture.update = function () {
        }; // texture has been updated, remove update handler
      };
    }

    static createVideoUpdateHandle(texture:Texture, video:HTMLVideoElement) {
      var gl = texture.gl;
      return function () {
        texture.ready = video.readyState >= 3;
        if (texture.ready) {
          texture.use();
          gl.texImage2D(texture.type, 0, texture.pixelFormat, texture.pixelFormat, texture.pixelType, video);
        }
        texture.width = video.videoWidth;
        texture.height = video.videoHeight;
        texture.isPOT = utils.isPowerOfTwo(texture.width) && utils.isPowerOfTwo(texture.height);
      };
    }

    setup(opts?:TextureOptions):Texture {
      opts = opts || {};

      this.pixelFormat = PixelFormat[opts.pixelFormat] || this.pixelFormat || PixelFormat.RGBA;
      this.pixelType = DataType[opts.pixelType] || this.pixelType || DataType.ubyte;
      this.type = TextureType[opts.type] || this.type || TextureType.Texture2D;
      this.generateMipmap = opts.generateMipmap == null ? !!this.generateMipmap : !!opts.generateMipmap;

      if (opts.handle) {
        this.destroy();
        this.handle = opts.handle;
      }
      if (!this.handle || !this.gl.isTexture(this.handle)) {
        this.handle = this.gl.createTexture();
      }

      this.ready = false;
      var source = opts.data;

      if (utils.isString(source)) {
        this.generateMipmap = true;
        this.setUrl(source);
      } else if (source instanceof HTMLImageElement) {
        this.generateMipmap = true;
        this.setImage(source);
      } else if (source instanceof HTMLVideoElement) {
        this.setVideo(source);
      } else if (utils.isArray(source)) {
        this.generateMipmap = true;
        this.setData(new Uint8Array(source));
      } else if (source) {
        this.setImage(source);
      } else {
        this.width = opts.width;
        this.height = opts.height;
        this.ready = true;
        this.gl.bindTexture(this.type, this.handle);
        this.gl.texImage2D(this.type, 0, this.pixelFormat, this.width, this.height, 0, this.pixelFormat, this.pixelType, null);
        this.gl.bindTexture(this.type, null);
      }
      return this;
    }

    destroy():Texture {
      if (this.gl.isTexture(this.handle)) {
        this.gl.deleteTexture(this.handle);
        this.handle = null;
      }
      return this;
    }

    use():Texture {
      this.gl.bindTexture(this.type, this.handle);
      return this;
    }

    setUrl(url:string):Texture {
      var ext = url.substr(url.lastIndexOf('.'));
      var isVideo = Texture.videoTypes.indexOf(ext) >= 0;
      if (isVideo) {
        this.setVideoUrl(url);
      } else {
        this.setImageUrl(url);
      }
      return this;
    }

    setImageUrl(url:string):Texture {
      this.update = function () {
      };
      this.ready = false;

      var that = this;
      var image = new Image();
      image.onload = function () {
        that.setImage(image);
      };
      image.src = url;
      return this;
    }

    setVideoUrl(url:string):Texture {
      this.update = function () {
      };
      this.ready = false;

      var that = this;
      var element = document.createElement('video');
      element.oncanplay = function () {
        that.setVideo(element);
      };
      element.src = url;
      return this;
    }

    setImage(image:HTMLImageElement):Texture {
      this.update = Texture.createImageUpdateHandle(this, image);
      this.update();
      return this;
    }

    setVideo(video:HTMLVideoElement):Texture {
      this.update = Texture.createVideoUpdateHandle(this, video);
      this.update();
      return this;
    }

    setData(data, width?:number, height?:number):Texture {
      this.update = function () {
      };
      var pixelCount = data.length / PixelFormatElementCount[this.pixelFormat];
      if (!width || !height) {
        width = height = Math.sqrt(pixelCount) | 0;
      }
      if (width * height !== pixelCount) {
        throw "width and height does not match the data length";
      }
      var gl = this.gl;
      this.use();
      gl.texImage2D(this.type, 0, this.pixelFormat, width, height, 0, this.pixelFormat, this.pixelType, data);
      if (this.generateMipmap) {
        gl.generateMipmap(this.type);
      }
      this.width = width;
      this.height = height;
      this.ready = true;
      this.isPOT = utils.isPowerOfTwo(width) && utils.isPowerOfTwo(height);
      return this;
    }
  }
}
