module Glib.Graphics {

  var noop = function(){}
  
  export interface TextureOptions {
    /** Whether or not to automatically generate mip maps */
    generateMipmap?: boolean,
    /** The pixel format to be used */
    pixelFormat?: number,
    /** The pixel element data tupe to be used */
    pixelType?: number,
    /** The texture type */
    type?: number,
    /** The wrapped WebGLTexture object */
    handle?: WebGLTexture,
    /** The texture width */
    width?:number,
    /** The texture height */
    height?:number,
    /** The initial texture data to set */
    data?: any,
    /** The depth format of the depth stencil buffer to use when the texture is used as a render target */
    depthFormat?:number
  }

  // Describes a texture object.
  export class Texture {
    /** The unique id */
    uid:string
    /** The Graphics.Device */
    device:Device
    /** The GL context */
    gl:any
    /** The texture width */
    width:number = 0
    /** The texture height */
    height:number = 0
    /**
     * Indicates whether texture data has been set and the texture is ready to be used in a shader.
     * This property is useful when the texture is loaded from an image or video URL. In this case ```ready``` is
     * initially ```false``` and flips to ```true``` as soon the image or video source has been loaded.
     */
    ready:boolean = false
    /** Indicates whether the texture width and height is a power of two value. */
    isPOT:boolean = false
    /** Indicates whether mipmaps should be automatically created when data is iset. */
    generateMipmap:boolean = true
    /** Indicates the used pixel format. */
    pixelFormat:number = PixelFormat.RGBA
    /** Indicates the data type of the pixel elements */
    pixelType:number = DataType.ubyte
    /** Indicates the texture type */
    type:number = TextureType.Texture2D
    
    /**
     * If Texture is created as video texture this holds the HTMLVideoElement.
     * Setting this property wont have any effect.
     */
    video:HTMLVideoElement = null

    /**
     * If Texture is created as image texture this holds the HTMLImageElement.
     * Setting this property wont have any effect.
     */
    image:HTMLImageElement = null

    update:()=> void = noop
    handle:WebGLTexture = null
    
    /**
     * The cached time value of the currently running video.
     */
    private videoTime = -1

    /** 
     * Creates a texture for given device and with given options. 
     * The options are passed to the stup method without any modification. 
     */
    constructor(device:Device, options:TextureOptions={}) {
      this.uid = utils.uuid()
      this.device = device
      this.gl = device.context
      this.setup(options)
    }

    private depthFormatField: number

    /**
     * The depth format of the depth stencil buffer to be used when the texture is used as a render target
     */
    get depthFormat():number {
      return this.depthFormatField
    }
    set depthFormat(value:number) {
      this.device.unregisterRenderTarget(this)
      this.depthFormatField = value
      if (value != null) {
        this.device.registerRenderTarget(this)  
      }
    }

    /** 
     * Indicates whether this texture is intendet to be used as a renter target 
     */
    get isRenderTarget():boolean {
      return this.depthFormatField != null
    }

    /** 
     * Gets the name string of the used pixel format 
     */
    get pixelFormatName():number {
      return PixelFormatName[this.pixelFormat]
    }

    /**
     * Gets the string name of the used pixel type
     */
    get pixelTypeName():number {
      return DataTypeName[this.pixelType]
    }
    
    /**
     * Gets the string name of the used texture type
     */
    get typeName():number {
      return TextureTypeName[this.type]
    }

    /**
     * Collection of file extensions that are recognized as video files. Contains the values ['mp4', 'ogv', 'ogg']
     */
    static videoTypes = ['.mp4', '.ogv', '.ogg']

    static createImageUpdateHandle(texture:Texture, image:HTMLImageElement) {
      var gl = texture.gl
      return function () {
        texture.ready = (!!image.naturalWidth && !!image.naturalHeight)
        if (!texture.ready) return // image has not been downloaded yet

        gl.bindTexture(texture.type, texture.handle)
        gl.texImage2D(texture.type, 0, texture.pixelFormat, texture.pixelFormat, texture.pixelType, image)
        if (texture.generateMipmap) {
          gl.generateMipmap(texture.type)
        }
        gl.bindTexture(texture.type, null)

        texture.width = image.naturalWidth
        texture.height = image.naturalHeight
        texture.isPOT = utils.isPowerOfTwo(texture.width) && utils.isPowerOfTwo(texture.height)
        texture.update = noop // texture has been updated, remove update handler
      };
    }

    static createVideoUpdateHandle(texture:Texture, video:HTMLVideoElement) {
      var gl = texture.gl
      return function () {
        texture.width = video.videoWidth
        texture.height = video.videoHeight
        texture.isPOT = utils.isPowerOfTwo(texture.width) && utils.isPowerOfTwo(texture.height)
        texture.ready = video.readyState >= 3
        if (texture.ready && (texture.videoTime !== video.currentTime)) {
          
          texture.videoTime = video.currentTime
          gl.bindTexture(texture.type, texture.handle)
          gl.texImage2D(texture.type, 0, texture.pixelFormat, texture.pixelFormat, texture.pixelType, video)
          if (texture.generateMipmap && texture.isPOT) {
            gl.generateMipmap(texture.type)
          }
          gl.bindTexture(texture.type, null)
        }
      };
    }

    setup(options:TextureOptions={}):Texture {

      var width = options.width || this.width
      var height = options.height || this.height
      var type = TextureType[options.type] || this.type
      var pixelType = DataType[options.pixelType] || this.pixelType
      var pixelFormat = PixelFormat[options.pixelFormat] || this.pixelFormat
      var handle = options.handle == null ? this.handle : options.handle
      var genMipMaps = options.generateMipmap == null ? !!this.generateMipmap : !!options.generateMipmap
      var depthFormat = options.depthFormat != void 0 ? options.depthFormat : this.depthFormat
      
      if ((handle && handle !== this.handle) || width !== this.width || height !== this.height || pixelFormat !== this.pixelFormat || pixelType !== this.pixelType || type !== this.type) {
        this.destroy()
        this.handle = options.handle
      }
      if (!this.handle || !this.gl.isTexture(this.handle)) {
        this.handle = this.gl.createTexture()
      }
      
      this.width = width
      this.height = height
      this.type = type
      this.pixelType = pixelType
      this.pixelFormat = pixelFormat
      this.generateMipmap = genMipMaps
      this.ready = false
      this.depthFormat = depthFormat
      
      var source = options.data

      if (utils.isString(source)) {
        this.setUrl(source)
      } else if (source instanceof HTMLImageElement) {
        this.setImage(source)
      } else if (source instanceof HTMLVideoElement) {
        this.setVideo(source)
      } else if (utils.isArray(source)) {
        if (utils.isObject(source[0])) {
          this.setVideoUrls(source)
        } else {
          this.setData(new Uint8Array(source))
        }
      } else if (source) {
        this.setImage(source)
      } else {
        this.ready = true
        this.gl.bindTexture(this.type, this.handle)
        this.gl.texImage2D(this.type, 0, this.pixelFormat, this.width, this.height, 0, this.pixelFormat, this.pixelType, null)
        this.gl.bindTexture(this.type, null)
      }
      return this
    }

    /**
     * Releases all resources and notifies the device that the texture is being destroyed.
     */
    destroy():Texture {
      this.image = null
      this.video = null
      this.device.unregisterRenderTarget(this)
      if (this.handle != null && this.gl.isTexture(this.handle)) {
        this.gl.deleteTexture(this.handle)
        this.handle = null
      }
      return this
    }

    /**
     * Bind the texture to the gl context.
     */
    use():Texture {
      this.gl.bindTexture(this.type, this.handle)
      return this
    }

    /**
     * Sets the texture source from an url.
     * The url is checked against the `Texture.videoTypes` array to detect
     * whether the url points to an image or video. 
     */
    setUrl(url:string):Texture {
      var ext = url.substr(url.lastIndexOf('.'))
      var isVideo = Texture.videoTypes.indexOf(ext) >= 0
      if (isVideo) {
        this.setVideoUrl(url)
      } else {
        this.setImageUrl(url)
      }
      return this
    }

    /**
     * Sets the texture source from an image url
     */
    setImageUrl(url:string):Texture {
      this.update = noop
      this.ready = false
      var image = new Image()
      image.src = url
      this.setImage(image)
      return this
    }

    /**
     * Sets the texture source from a video url
     */
    setVideoUrl(url:string):Texture {
      this.update = noop
      this.ready = false
      var video = document.createElement('video')
      video.src = url
      video.load()
      this.setVideo(video)
      return this
    }

    /**
     * Sets the texture source from video urls.
     */
    setVideoUrls(options:any[]):Texture {
      this.update = noop
      this.ready = false
      var video = document.createElement('video')
      let valid = false
      for (let option of options) {
        if (video.canPlayType(option.type)) {
          Glib.utils.debug("[Texture] canPlayType", option)
          video.src = option.src
          valid = true
          break
        }
      }
      if (!valid) {
        Glib.utils.debug("[Texture] no supported format found. Video won't play.", options)
      }
      this.setVideo(video)
      return this
    }

    /**
     * Sets the texture source from HtmlImageElement
     */
    setImage(image:HTMLImageElement):Texture {
      this.image = image
      this.video = null
      this.update = Texture.createImageUpdateHandle(this, image)
      this.update()
      return this
    }
    
    /**
     * Sets the texture source from HTMLVideoElement
     */
    setVideo(video:HTMLVideoElement):Texture {
      this.video = video
      this.image = null
      this.update = Texture.createVideoUpdateHandle(this, video)
      this.update()
      return this
    }

    /**
     * Sets the texture source from data array or buffer
     */
    setData(data, width?:number, height?:number):Texture {
      this.video = null
      this.image = null
      this.update = noop
      var pixelCount = data.length / PixelFormatElementCount[this.pixelFormat]
      if (!width || !height) {
        width = height = Math.sqrt(pixelCount) | 0
      }
      if (width * height !== pixelCount) {
        throw "width and height does not match the data length"
      }
      var gl = this.gl
      this.use()
      gl.texImage2D(this.type, 0, this.pixelFormat, width, height, 0, this.pixelFormat, this.pixelType, data)
      if (this.generateMipmap) {
        gl.generateMipmap(this.type)
      }
      this.width = width
      this.height = height
      this.ready = true
      this.isPOT = utils.isPowerOfTwo(width) && utils.isPowerOfTwo(height)
      return this
    }

    get texel():IVec2 { 
      return { x: 1.0 / this.width, y: 1.0 / this.height } 
    }
  }
}
