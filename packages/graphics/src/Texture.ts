import { isArray, isObject, isString, Log, uuid } from '@gglib/utils'
import {
  ArrayType,
  DataType,
  DataTypeOption,
  DepthFormatOption,
  nameOfDataType,
  nameOfPixelFormat,
  nameOfTextureType,
  PixelFormat,
  pixelFormatElementCount,
  PixelFormatOption,
  TextureType,
  TextureTypeOption,
  valueOfDataType,
  valueOfDepthFormat,
  valueOfPixelFormat,
  valueOfTextureType,
} from './enums'

import { Device } from './Device'
import { SamplerState, SamplerStateParams } from './states'

export type TextureDataOption = number[] | ArrayBuffer | ArrayBufferView

function isPowerOfTwo(value: number): boolean {
  return ((value > 0) && !(value & (value - 1))) // tslint:disable-line
}

/**
 * Texture constructor options
 *
 * @public
 */
export interface TextureOptions {
  /**
   * Whether or not to automatically generate mip maps
   */
  generateMipmap?: boolean
  /**
   * The pixel format to be used
   */
  pixelFormat?: PixelFormatOption
  /**
   * The pixel element data tupe to be used
   */
  pixelType?: DataTypeOption
  /**
   * The texture type
   */
  type?: TextureTypeOption
  /**
   * The wrapped WebGLTexture object
   */
  handle?: WebGLTexture
  /**
   * The texture width
   */
  width?: number
  /**
   * The texture height
   */
  height?: number
  /**
   * The initial texture data to set
   */
  data?: any
  /**
   * The depth format of the depth stencil buffer to use when the texture is used as a render target
   */
  depthFormat?: DepthFormatOption
  /**
   * The sampler state to be used together with this texture
   */
  sampler?: SamplerStateParams
}

/**
 * Describes a texture object.
 *
 * @public
 */
export class Texture {

  /**
   * A symbol identifying the TextureOptions
   */
  public static readonly Options = Symbol('TextureOptions')

  /**
   * A symbol identifying the Texture2D class
   */
  public static readonly Texture2D = Symbol('Texture2D')

  /**
   * A symbol identifying the TextureCube class
   */
  public static readonly TextureCube = Symbol('TextureCube')

  private $uid: string = uuid()
  /**
   * Unique resource id
   */
  public get uuid() {
    return this.$uid
  }

  private $device: Device
  /**
   * The Graphics.Device
   */
  public get device(): Device {
    return this.$device
  }

  private $gl: WebGLRenderingContext
  /**
   * The GL context
   */
  public get gl(): WebGLRenderingContext {
    return this.$gl
  }

  private $width: number = 0
  /**
   * The texture width
   */
  public get width() {
    return this.$width
  }

  private $height: number = 0
  /**
   * The texture height
   */
  public get height() {
    return this.$height
  }

  private $ready: boolean = false
  /**
   * Indicates whether texture data has been set
   *
   * @remarks
   * If the texture data must be loaded asynchronously (e.g. image or video URL) this property will be false as long
   * as the data has not arrived. A shader should not attempt to bind this texture until the property is switched to true.
   */
  public get ready() {
    return this.$ready
  }

  private $isPOT: boolean = false
  /**
   * Indicates whether the texture size is a power of two value.
   */
  public get isPOT() {
    return this.$isPOT
  }

  private $generateMipmap: boolean = true
  /**
   * Indicates whether mipmaps should be generated.
   */
  public get generateMipmap() {
    return this.$generateMipmap
  }

  private $pixelFormat: PixelFormat = PixelFormat.RGBA
  /**
   * Indicates the used pixel format.
   */
  public get pixelFormat() {
    return this.$pixelFormat
  }

  private $pixelType: DataType = DataType.ubyte
  /**
   * Indicates the data type of the pixel elements
   */
  public get pixelType() {
    return this.$pixelType
  }

  private $type: TextureType = TextureType.Texture2D
  /**
   * Indicates the texture type
   */
  public get type() {
    return this.$type
  }

  private $video: HTMLVideoElement = null
  /**
   * The HTMLVideoElement that was passed as data.
   */
  public get video() {
    return this.$video
  }

  private $image: HTMLImageElement = null
  /**
   * The HTMLImageElement that was passed as data.
   */
  public get image() {
    return this.$image
  }

  private $handle: WebGLTexture = null
  /**
   * The webgl resource handle
   */
  public get handle() {
    return this.$handle
  }

  /**
   * The sampler state to be used together with this texture
   */
  public sampler: SamplerStateParams = {}

  /**
   * The recent video playback timestamp.
   */
  private videoTime = -1

  /**
   * Constructs an instance of a Texture.
   *
   * @remarks
   * The options are passed down to {@link Texture.setup}
   */
  constructor(device: Device, options: TextureOptions= {}) {
    this.$device = device
    this.$gl = device.context
    this.setup(options)
  }

  private depthFormatField: number

  /**
   * Depth stencil format if this is a render target
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
    return nameOfPixelFormat(this.pixelFormat)
  }

  /**
   * Gets the string name of the used pixel type
   */
  get pixelTypeName(): string {
    return nameOfDataType(this.pixelType)
  }

  /**
   * Gets the string name of the used texture type
   */
  get typeName(): string {
    return nameOfTextureType(this.type)
  }

  /**
   * Collection of file extensions that are recognized as video files.
   */
  public static videoTypes = ['.mp4', '.ogv', '.ogg', '.webm']

  public setup(options: TextureOptions= {}): Texture {

    let width = options.width || this.width
    let height = options.height || this.height

    let type = valueOfTextureType(options.type) || this.type
    let pixelType = valueOfDataType(options.pixelType) || this.pixelType
    let pixelFormat = valueOfPixelFormat(options.pixelFormat) || this.pixelFormat
    let depthFormat = valueOfDepthFormat(options.depthFormat) || this.depthFormat

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
      this.$handle = options.handle
    }
    if (!this.handle || !this.gl.isTexture(this.handle)) {
      this.$handle = this.gl.createTexture()
    }

    this.$width = width
    this.$height = height
    this.$type = type
    this.$pixelType = pixelType
    this.$pixelFormat = pixelFormat
    this.depthFormat = depthFormat
    this.sampler = options.sampler || {...SamplerState.Default}
    this.$generateMipmap = genMipMaps
    this.$ready = false

    let source = options.data

    if (isString(source)) {
      this.setUrl(source)
    } else if (source instanceof HTMLImageElement) {
      this.setImage(source)
    } else if (source instanceof HTMLVideoElement) {
      this.setVideo(source)
    } else if (isArray(source) && isObject(source[0])) {
      this.setVideoUrls(source)
    } else if (source && (source instanceof Array || source instanceof ArrayBuffer || source.buffer)) {
      this.setData(source, options.width, options.height)
    } else {
      if (source) {
        Log.w(`[Texture] 'data' option has an unrecognized type.`)
      }
      this.$ready = true
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
    this.$image = null
    this.$video = null
    this.device.unregisterRenderTarget(this)
    if (this.handle != null && this.gl.isTexture(this.handle)) {
      this.gl.deleteTexture(this.handle)
      this.$handle = null
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
   *
   * @remarks
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
    this.$ready = false
    let image = new Image()
    // if ((new URL(url)).origin !== window.location.origin) {
    image.crossOrigin = ''
    // }
    image.src = url
    this.setImage(image)
    return this
  }

  /**
   * Sets the texture source from a video url
   */
  public setVideoUrl(url: string): Texture {
    this.$ready = false
    let video = document.createElement('video')
    video.src = url
    // if ((new URL(url)).origin !== window.location.origin) {
    video.crossOrigin = ''
    // }
    video.load()
    this.setVideo(video)
    return this
  }

  /**
   * Sets the texture source from video urls.
   */
  public setVideoUrls(options: any[]): Texture {
    this.$ready = false
    let video = document.createElement('video')
    let valid = false
    for (let option of options) {
      if (video.canPlayType(option.type)) {
        video.src = option.src
        valid = true
        break
      }
    }
    if (!valid) {
      Log.w("[Texture] no supported format found. Video won't play.", options)
    }
    this.setVideo(video)
    return this
  }

  /**
   * Sets the texture source from HtmlImageElement
   */
  public setImage(image: HTMLImageElement): Texture {
    this.$image = image
    this.$video = null
    this.update()
    return this
  }

  /**
   * Sets the texture source from HTMLVideoElement
   */
  public setVideo(video: HTMLVideoElement): Texture {
    this.$video = video
    this.$image = null
    this.update()
    return this
  }

  /**
   * Sets the texture source from data array or buffer
   */
  public setData(data: TextureDataOption, width?: number, height?: number): Texture {
    this.$video = null
    this.$image = null
    let buffer: ArrayBufferView
    if (data instanceof Array || data instanceof ArrayBuffer) {
      buffer = new ArrayType[this.pixelType](data)
    } else if (data && (data as ArrayBufferView).buffer instanceof ArrayBuffer) {
      if (data instanceof Uint8ClampedArray) {
        buffer = new Uint8Array(data.buffer)
      } else {
        buffer = (data as ArrayBufferView)
      }
    }
    if (!buffer) {
      throw new Error(`invalid argument 'data'. must be one of [number[] | ArrayBuffer | ArrayBufferView]`)
    }

    let pixelCount = buffer.byteLength / pixelFormatElementCount(this.pixelFormat)
    if (!width || !height) {
      width = height = Math.floor(Math.sqrt(pixelCount))
    }
    if (width * height !== pixelCount) {
      throw new Error('width and height does not match the data length')
    }
    let gl = this.gl
    this.use()
    gl.texImage2D(this.type, 0, this.pixelFormat, width, height, 0, this.pixelFormat, this.pixelType, buffer)
    if (this.generateMipmap) {
      gl.generateMipmap(this.type)
    }
    this.$width = width
    this.$height = height
    this.$ready = true
    this.$isPOT = isPowerOfTwo(width) && isPowerOfTwo(height)
    return this
  }

  public get texel() {
    return { x: 1.0 / this.width, y: 1.0 / this.height }
  }

  /**
   * Updates the texture from current image or video element.
   */
  public update() {
    if (this.$image) {
      Texture.updateFromImage(this, this.$image)
    }
    if (this.$video) {
      Texture.updateFromVideo(this, this.$video)
    }
  }

  private static updateFromImage(texture: Texture, image: HTMLImageElement) {
    if (texture.ready || !image || !image.complete) {
      return
    }
    texture.$ready = true

    const gl = texture.gl
    gl.bindTexture(texture.$type, texture.$handle)
    gl.texImage2D(texture.$type, 0, texture.$pixelFormat, texture.$pixelFormat, texture.$pixelType, image)
    if (texture.$generateMipmap) {
      gl.generateMipmap(texture.$type)
    }
    gl.bindTexture(texture.$type, null)

    texture.$width = image.naturalWidth
    texture.$height = image.naturalHeight
    texture.$isPOT = isPowerOfTwo(texture.width) && isPowerOfTwo(texture.height)
  }

  private static updateFromVideo(texture: Texture, video: HTMLVideoElement) {
    if (!video || video.readyState < 3 || video.currentTime === texture.videoTime) {
      return
    }
    texture.$ready = true

    let gl = texture.gl
    gl.bindTexture(texture.$type, texture.$handle)
    gl.texImage2D(texture.$type, 0, texture.$pixelFormat, texture.$pixelFormat, texture.$pixelType, video)
    if (texture.generateMipmap && texture.isPOT) {
      gl.generateMipmap(texture.$type)
    }
    gl.bindTexture(texture.$type, null)

    texture.$width = video.videoWidth
    texture.$height = video.videoHeight
    texture.$isPOT = isPowerOfTwo(texture.width) && isPowerOfTwo(texture.height)
    texture.$ready = video.readyState >= 3
    texture.videoTime = video.currentTime
  }
}
