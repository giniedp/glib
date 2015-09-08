module Glib.Graphics {

  var defaultPixel = new Uint8Array([128, 128, 128, 255]);
  var noop = function(){};
  
  export interface TextureOptions {
    /**
     * Whether or not to automatically generate mip maps
     */
    generateMipmap?: boolean,
    /**
     * The pixel format to be used
     */
    pixelFormat?: number,
    /**
     * The pixel element data tupe to be used
     */
    pixelType?: number,
    /**
     * The texture type
     */
    type?: number,
    /**
     * The wrapped WebGLTexture object
     */
    handle?: WebGLTexture,
    /**
     * The texture width
     */
    width?:number,
    /**
     * The texture height
     */
    height?:number,
    /**
     * The initial texture data to set
     */
    data?: any,
    /**
     * The depth format of the depth stencil buffer to use when the texture is used as a render target 
     */
    depthFormat?:number
  }

  /**
   * Describes a texture object.
   */
  export class Texture {
    /**
     * The Graphics.Device
     */
    device:Device;
    /**
     * The GL context
     */
    gl:any;
    /**
     * The texture width
     * @type {number}
     */
    width:number = 0;
    /**
     * The texture height
     * @type {number}
     */
    height:number = 0;
    /**
     * Indicates whether texture data has been set and the texture is ready to be used in a shader.
     * This property is useful when the texture is loaded from an image or video URL. In this case ```ready``` is
     * initially ```false``` and flips to ```true``` as soon the image or video source has been loaded.
     * @type {boolean}
     */
    ready:boolean = false;
    /**
     * Indicates whether the texture width and height is a power of two value.
     * @type {boolean}
     */
    isPOT:boolean = false;
    /**
     * Indicates whether mipmaps should be automatically created when data is iset.
     * @type {boolean}
     */
    generateMipmap:boolean = true;
    /**
     * Indicates the used pixel format.
     * @type {number}
     */
    pixelFormat:number = PixelFormat.RGBA;
    /**
     * Indicates the data type of the pixel elements
     * @type {number}
     */
    pixelType:number = DataType.ubyte;
    /**
     * Indicates the texture type
     * @type {number}
     */
    type:number = TextureType.Texture2D;
    /**
     *
     * @type {function()}
     */
    update:()=> void = noop;
    /**
     *
     * @type {WebGLTexture}
     */
    handle:WebGLTexture = null;

    /**
     * The depth format of the depth stencil buffer to be used when the texture is used as a render target 
     */
    depthFormat:number = DepthFormat.None;
    
    /**
     * The cached time value of the currently running video.
     * @type {number}
     */
    private _lastVideoTime = -1;

    /**
     * Initializes a new texture
     * @param device The graphics device
     * @param options The texture options
     */
    constructor(device:Device, options:TextureOptions={}) {
      this.device = device;
      this.gl = device.context;
      this.setup(options);
    }

    /**
     * Gets the name string of the used pixel format
     */
    get pixelFormatName():number {
      return PixelFormatName[this.pixelFormat];
    }

    /**
     * Gets the string name of the used pixel type
     */
    get pixelTypeName():number {
      return DataTypeName[this.pixelType];
    }

    /**
     * Gets the string name of the used texture type
     */
    get typeName():number {
      return TextureTypeName[this.type];
    }

    /**
     * Collection of file extensions that are recognized as video files. Contains the values ['mp4', 'ogv', 'ogg']
     */
    static videoTypes = ['mp4', 'ogv', 'ogg'];

    static createImageUpdateHandle(texture:Texture, image:HTMLImageElement) {
      var gl = texture.gl;
      return function () {
        texture.ready = (!!image.naturalWidth && !!image.naturalHeight);

        if (!texture.ready) {
          // image has not been downloaded yet
          return;
        }

        gl.bindTexture(texture.type, texture.handle);
        gl.texImage2D(texture.type, 0, texture.pixelFormat, texture.pixelFormat, texture.pixelType, image);
        if (texture.generateMipmap) {
          gl.generateMipmap(texture.type);
        }
        gl.bindTexture(texture.type, null);

        texture.width = image.naturalWidth;
        texture.height = image.naturalHeight;
        texture.isPOT = utils.isPowerOfTwo(texture.width) && utils.isPowerOfTwo(texture.height);
        texture.update = noop; // texture has been updated, remove update handler
      };
    }

    static createVideoUpdateHandle(texture:Texture, video:HTMLVideoElement) {
      var gl = texture.gl;
      return function () {
        texture.width = video.videoWidth;
        texture.height = video.videoHeight;
        texture.isPOT = utils.isPowerOfTwo(texture.width) && utils.isPowerOfTwo(texture.height);
        texture.ready = video.readyState >= 3;
        if (texture.ready && (texture._lastVideoTime !== video.currentTime)) {
          texture._lastVideoTime = video.currentTime;
          gl.bindTexture(texture.type, texture.handle);
          gl.texImage2D(texture.type, 0, texture.pixelFormat, texture.pixelFormat, texture.pixelType, video);
          if (texture.generateMipmap) {
            gl.generateMipmap(texture.type);
          }
          gl.bindTexture(texture.type, null);
        }
      };
    }

    setup(options:TextureOptions={}):Texture {

      var width = options.width || this.width;
      var height = options.height || this.height;
      var type = TextureType[options.type] || this.type;
      var pixelType = DataType[options.pixelType] || this.pixelType;
      var pixelFormat = PixelFormat[options.pixelFormat] || this.pixelFormat;
      var handle = options.handle == null ? this.handle : options.handle;
      var genMipMaps = options.generateMipmap == null ? !!this.generateMipmap : !!options.generateMipmap;
      
      if ((handle && handle !== this.handle) || width !== this.width || height !== this.height || pixelFormat !== this.pixelFormat || pixelType !== this.pixelType || type !== this.type) {
        this.destroy();
        this.handle = options.handle;
      }
      if (!this.handle || !this.gl.isTexture(this.handle)) {
        this.handle = this.gl.createTexture();
      }
      
      this.width = width;
      this.height = height;
      this.type = type;
      this.pixelType = pixelType;
      this.pixelFormat = pixelFormat;
      this.generateMipmap = genMipMaps;
      this.ready = false;
      
      var source = options.data;

      if (utils.isString(source)) {
        this.setUrl(source);
      } else if (source instanceof HTMLImageElement) {
        this.setImage(source);
      } else if (source instanceof HTMLVideoElement) {
        this.setVideo(source);
      } else if (utils.isArray(source)) {
        this.setData(new Uint8Array(source));
      } else if (source) {
        this.setImage(source);
      } else {
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
