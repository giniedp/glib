import { isArray, isObject, isPowerOfTwo, isString, Log, uuid } from '@glib/core'
import {
  DataType,
  DataTypeOption,
  DepthFormat,
  DepthFormatOption,
  PixelFormat,
  PixelFormatElementCount,
  PixelFormatOption,
  TextureType,
  TextureTypeOption,
} from './enums'

import { Device } from './Device'

function noop() {
  //
}

export interface TextureOptions {
  /** Whether or not to automatically generate mip maps */
  generateMipmap?: boolean
  /** The pixel format to be used */
  pixelFormat?: PixelFormatOption
  /** The pixel element data tupe to be used */
  pixelType?: DataTypeOption
  /** The texture type */
  type?: TextureTypeOption
  /** The wrapped WebGLTexture object */
  handle?: WebGLTexture
  /** The texture width */
  width?: number
  /** The texture height */
  height?: number
  /** The initial texture data to set */
  data?: any
  /** The depth format of the depth stencil buffer to use when the texture is used as a render target */
  depthFormat?: DepthFormatOption
}

// Describes a texture object.
export class Texture {
  /**
   * The unique id
   */
  public uid: string
  /**
   * The Graphics.Device
   */
  public device: Device
  /**
   * The GL context
   */
  public gl: WebGLRenderingContext
  /**
   * The texture width
   */
  public width: number = 0
  /**
   * The texture height
   */
  public height: number = 0
  /**
   * Indicates whether texture data has been set and the texture is ready to be used in a shader.
   * This property is useful when the texture is loaded from an image or video URL. In this case ```ready``` is
   * initially ```false``` and flips to ```true``` as soon the image or video source has been loaded.
   */
  public ready: boolean = false
  /**
   * Indicates whether the texture width and height is a power of two value.
   */
  public isPOT: boolean = false
  /**
   * Indicates whether mipmaps should be automatically created when data is iset.
   */
  public generateMipmap: boolean = true
  /**
   * Indicates the used pixel format.
   */
  public pixelFormat: number = PixelFormat.RGBA
  /**
   * Indicates the data type of the pixel elements
   */
  public pixelType: number = DataType.ubyte
  /**
   * Indicates the texture type
   */
  public type: number = TextureType.Texture2D

  /**
   * If Texture is created as video texture this holds the HTMLVideoElement.
   * Setting this property wont have any effect.
   */
  public video: HTMLVideoElement = null

  /**
   * If Texture is created as image texture this holds the HTMLImageElement.
   * Setting this property wont have any effect.
   */
  public image: HTMLImageElement = null

  public update: () => void = noop
  public handle: WebGLTexture = null

  /**
   * The cached time value of the currently running video.
   */
  private videoTime = -1

  /**
   * Creates a texture for given device and with given options.
   * The options are passed to the stup method without any modification.
   */
  constructor(device: Device, options: TextureOptions= {}) {
    this.uid = uuid()
    this.device = device
    this.gl = device.context
    this.setup(options)
  }

  private depthFormatField: number

  /**
   * The depth format of the depth stencil buffer to be used when the texture is used as a render target
   */
  get depthFormat(): number {
    return this.depthFormatField
  }
  set depthFormat(value: number) {
    this.device.unregisterRenderTarget(this)
    this.depthFormatField = value
    if (value != null) {
      this.device.registerRenderTarget(this)
    }
  }

  /**
   * Indicates whether this texture is intendet to be used as a renter target
   */
  get isRenderTarget(): boolean {
    return this.depthFormatField != null
  }

  /**
   * Gets the name string of the used pixel format
   */
  get pixelFormatName(): string {
    return PixelFormat.nameOf(this.pixelFormat)
  }

  /**
   * Gets the string name of the used pixel type
   */
  get pixelTypeName(): string {
    return DataType.nameOf(this.pixelType)
  }

  /**
   * Gets the string name of the used texture type
   */
  get typeName(): string {
    return TextureType.nameOf(this.type)
  }

  /**
   * Collection of file extensions that are recognized as video files. Contains the values ['mp4', 'ogv', 'ogg']
   */
  public static videoTypes = ['.mp4', '.ogv', '.ogg']

  public static createImageUpdateHandle(texture: Texture, image: HTMLImageElement) {
    let gl = texture.gl
    return () => {
      texture.ready = (!!image.naturalWidth && !!image.naturalHeight)
      if (!texture.ready) { return } // image has not been downloaded yet

      gl.bindTexture(texture.type, texture.handle)
      gl.texImage2D(texture.type, 0, texture.pixelFormat, texture.pixelFormat, texture.pixelType, image)
      if (texture.generateMipmap) {
        gl.generateMipmap(texture.type)
      }
      gl.bindTexture(texture.type, null)

      texture.width = image.naturalWidth
      texture.height = image.naturalHeight
      texture.isPOT = isPowerOfTwo(texture.width) && isPowerOfTwo(texture.height)
      texture.update = noop // texture has been updated, remove update handler
    }
  }

  public static createVideoUpdateHandle(texture: Texture, video: HTMLVideoElement) {
    let gl = texture.gl
    return () => {
      texture.width = video.videoWidth
      texture.height = video.videoHeight
      texture.isPOT = isPowerOfTwo(texture.width) && isPowerOfTwo(texture.height)
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
    }
  }

  public setup(options: TextureOptions= {}): Texture {

    let width = options.width || this.width
    let height = options.height || this.height

    let type = TextureType[options.type] || this.type
    let pixelType = DataType[options.pixelType] || this.pixelType
    let pixelFormat = PixelFormat[options.pixelFormat] || this.pixelFormat
    let depthFormat = DepthFormat[options.depthFormat] || this.depthFormat

    let handle = options.handle == null ? this.handle : options.handle
    let genMipMaps = options.generateMipmap == null ? !!this.generateMipmap : !!options.generateMipmap

    if (
      (handle && handle !== this.handle) ||
      width !== this.width ||
      height !== this.height ||
      pixelFormat !== this.pixelFormat ||
      pixelType !== this.pixelType ||
      type !== this.type
    ) {
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
    this.depthFormat = depthFormat
    this.generateMipmap = genMipMaps
    this.ready = false

    let source = options.data

    if (isString(source)) {
      this.setUrl(source)
    } else if (source instanceof HTMLImageElement) {
      this.setImage(source)
    } else if (source instanceof HTMLVideoElement) {
      this.setVideo(source)
    } else if (isArray(source)) {
      if (isObject(source[0])) {
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
  public destroy(): Texture {
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
  public use(): Texture {
    this.gl.bindTexture(this.type, this.handle)
    return this
  }

  /**
   * Sets the texture source from an url.
   * The url is checked against the `Texture.videoTypes` array to detect
   * whether the url points to an image or video.
   */
  public setUrl(url: string): Texture {
    let ext = url.substr(url.lastIndexOf('.'))
    let isVideo = Texture.videoTypes.indexOf(ext) >= 0
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
  public setImageUrl(url: string): Texture {
    this.update = noop
    this.ready = false
    let image = new Image()
    image.src = url
    this.setImage(image)
    return this
  }

  /**
   * Sets the texture source from a video url
   */
  public setVideoUrl(url: string): Texture {
    this.update = noop
    this.ready = false
    let video = document.createElement('video')
    video.src = url
    video.load()
    this.setVideo(video)
    return this
  }

  /**
   * Sets the texture source from video urls.
   */
  public setVideoUrls(options: any[]): Texture {
    this.update = noop
    this.ready = false
    let video = document.createElement('video')
    let valid = false
    for (let option of options) {
      if (video.canPlayType(option.type)) {
        Log.d('[Texture] canPlayType', option)
        video.src = option.src
        valid = true
        break
      }
    }
    if (!valid) {
      Log.d("[Texture] no supported format found. Video won't play.", options)
    }
    this.setVideo(video)
    return this
  }

  /**
   * Sets the texture source from HtmlImageElement
   */
  public setImage(image: HTMLImageElement): Texture {
    this.image = image
    this.video = null
    this.update = Texture.createImageUpdateHandle(this, image)
    this.update()
    return this
  }

  /**
   * Sets the texture source from HTMLVideoElement
   */
  public setVideo(video: HTMLVideoElement): Texture {
    this.video = video
    this.image = null
    this.update = Texture.createVideoUpdateHandle(this, video)
    this.update()
    return this
  }

  /**
   * Sets the texture source from data array or buffer
   */
  public setData(data: any, width?: number, height?: number): Texture {
    this.video = null
    this.image = null
    this.update = noop
    let pixelCount = data.length / PixelFormatElementCount[this.pixelFormat]
    if (!width || !height) {
      width = height = Math.floor(Math.sqrt(pixelCount))
    }
    if (width * height !== pixelCount) {
      throw new Error('width and height does not match the data length')
    }
    let gl = this.gl
    this.use()
    gl.texImage2D(this.type, 0, this.pixelFormat, width, height, 0, this.pixelFormat, this.pixelType, data)
    if (this.generateMipmap) {
      gl.generateMipmap(this.type)
    }
    this.width = width
    this.height = height
    this.ready = true
    this.isPOT = isPowerOfTwo(width) && isPowerOfTwo(height)
    return this
  }

  public get texel() {
    return { x: 1.0 / this.width, y: 1.0 / this.height }
  }
}
