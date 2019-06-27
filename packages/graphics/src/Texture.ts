import { IVec2 } from '@gglib/math'
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
import { SamplerStateParams } from './states'

/**
 * Type that is accepted by the {@link Texture.setData} method
 *
 * @public
 */
export type TextureDataOption = number[] | ArrayBuffer | ArrayBufferView

function isPowerOfTwo(value: number): boolean {
  return ((value > 0) && !(value & (value - 1))) // tslint:disable-line
}

function getDefinedOption<T, V>(options: T, key: keyof T, fallback: V): V {
  if (key in options) {
    return options[key] as any
  }
  return fallback
}

/**
 * Constructor options for {@link Texture}
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
   * The pixel element data type to be used
   */
  pixelType?: DataTypeOption
  /**
   * The texture type
   */
  type?: TextureTypeOption
  /**
   * The {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture} object to be reused
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
   *
   * @remarks
   * A value of type `string` is interpreted as an image or video URL
   */
  data?: string | HTMLImageElement | HTMLVideoElement | TextureDataOption
  /**
   * The depth format of the depth stencil buffer to use when the texture is used as a render target
   */
  depthFormat?: DepthFormatOption
  /**
   * The sampler state to be used together with this texture
   */
  sampler?: SamplerStateParams
  /**
   * Value for the `crossOrigin` attribute to be used when fetching image or video by url
   *
   * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
   * {@link https://blog.chromium.org/2011/07/using-cross-domain-images-in-webgl-and.html}
   */
  crossOrigin?: string
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

  /**
   * Unique resource id
   */
  public uid: string = uuid()

  /**
   * The Graphics.Device
   */
  public readonly device: Device

  /**
   * The texture width
   */
  public readonly width: number

  /**
   * The texture height
   */
  public readonly height: number

  /**
   * Indicates whether texture data has been set
   *
   * @remarks
   * If the texture data must be loaded asynchronously (e.g. image or video URL) this property will be false as long
   * as the data has not arrived. A shader should not attempt to bind this texture until the property is switched to true.
   */
  public readonly ready: boolean

  /**
   * Indicates whether the texture size is a power of two value.
   */
  public readonly isPOT: boolean

  /**
   * Indicates whether mip maps should be generated.
   */
  public readonly generateMipmap: boolean = true

  /**
   * Indicates the used pixel format.
   */
  public readonly pixelFormat: PixelFormat = PixelFormat.RGBA

  /**
   * Indicates the data type of the pixel elements
   */
  public readonly pixelType: DataType = DataType.ubyte

  /**
   * Indicates the texture type
   */
  public readonly type: TextureType = TextureType.Texture2D

  /**
   * The HTMLVideoElement that was passed as data.
   */
  public readonly video: HTMLVideoElement = null

  /**
   * The HTMLImageElement that was passed as data.
   */
  public readonly image: HTMLImageElement = null

  /**
   * The webgl resource handle
   */
  public readonly handle: WebGLTexture = null

  /**
   * The sampler state to be used together with this texture
   */
  public sampler: SamplerStateParams = null

  /**
   * Value for the `crossOrigin` attribute to be used when fetching image or video by url
   *
   * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
   * {@link https://blog.chromium.org/2011/07/using-cross-domain-images-in-webgl-and.html}
   */
  public readonly crossOrigin: string

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
    this.device = device
    this.setup(options)
  }

  private depthFormatField: number

  /**
   * Depth stencil format if this is a render target
   */
  public get depthFormat(): number {
    return this.depthFormatField
  }
  public set depthFormat(value: number) {
    this.device.unregisterRenderTarget(this)
    this.depthFormatField = value
    if (value != null) {
      this.device.registerRenderTarget(this)
    }
  }

  /**
   * Indicates whether this texture is intended to be used as a renter target
   */
  public get isRenderTarget(): boolean {
    return this.depthFormatField != null
  }

  /**
   * Gets the name of {@link Texture.pixelFormat}
   */
  public get pixelFormatName(): string {
    return nameOfPixelFormat(this.pixelFormat)
  }

  /**
   * Gets the name of {@link Texture.pixelType}
   */
  public get pixelTypeName(): string {
    return nameOfDataType(this.pixelType)
  }

  /**
   * Gets the name of {@link Texture."type"}
   */
  public get typeName(): string {
    return nameOfTextureType(this.type)
  }

  /**
   * Collection of file extensions that are recognized as video files.
   */
  public static videoTypes = ['.mp4', '.ogv', '.ogg', '.webm']

  public setup(options: TextureOptions= {}): this {

    let width = options.width || this.width
    let height = options.height || this.height

    let type = valueOfTextureType(getDefinedOption(options, 'type', this.type))
    let pixelType = valueOfDataType(getDefinedOption(options, 'pixelType', this.pixelType))
    let pixelFormat = valueOfPixelFormat(getDefinedOption(options, 'pixelFormat', this.pixelFormat))
    let depthFormat = valueOfDepthFormat(getDefinedOption(options, 'depthFormat', this.depthFormat))
    let handle = getDefinedOption(options, 'handle', this.handle)
    let genMipMaps = getDefinedOption(options, 'generateMipmap', this.generateMipmap)
    let crossOrigin = getDefinedOption(options, 'crossOrigin', this.crossOrigin)

    if (
      (handle && handle !== this.handle) ||
      width !== this.width ||
      height !== this.height ||
      pixelFormat !== this.pixelFormat ||
      pixelType !== this.pixelType ||
      type !== this.type
    ) {
      this.destroy();
      (this as { handle: WebGLTexture}).handle = options.handle
    }
    if (!this.handle || !this.device.context.isTexture(this.handle)) {
      (this as { handle: WebGLTexture}).handle = this.device.context.createTexture()
    }

    (this as { width: number }).width = width;
    (this as { height: number }).height  = height;
    (this as { type: number }).type = type;
    (this as { pixelType: number }).pixelType  = pixelType;
    (this as { pixelFormat: number }).pixelFormat  = pixelFormat;
    (this as { depthFormat: number }).depthFormat = depthFormat;
    (this as { generateMipmap: boolean }).generateMipmap = genMipMaps;
    (this as { ready: boolean }).ready = false;
    (this as { crossOrigin: string }).crossOrigin = crossOrigin

    this.sampler = options.sampler // || {...SamplerState.Default}

    let source = options.data

    if (isString(source)) {
      this.setUrl(source)
    } else if (source instanceof HTMLImageElement) {
      this.setImage(source)
    } else if (source instanceof HTMLVideoElement) {
      this.setVideo(source)
    } else if (isArray(source) && isObject(source[0])) {
      this.setVideoUrls(source as any)
    } else if (source && (source instanceof Array || source instanceof ArrayBuffer || source.buffer)) {
      this.setData(source, options.width, options.height)
    } else {
      if (source) {
        Log.w(`[Texture] 'data' option has an unrecognized type.`)
      }
      (this as { ready: boolean }).ready = true
      this.device.context.bindTexture(this.type, this.handle)
      this.device.context.texImage2D(this.type, 0, this.pixelFormat, this.width, this.height, 0, this.pixelFormat, this.pixelType, null)
      this.device.context.bindTexture(this.type, null)
    }
    return this
  }

  /**
   * Releases all resources and notifies the device that the texture is being destroyed.
   */
  public destroy(): this {
    (this as { image: any }).image = null;
    (this as { video: any }).video = null
    this.device.unregisterRenderTarget(this)
    if (this.handle != null && this.device.context.isTexture(this.handle)) {
      this.device.context.deleteTexture(this.handle);
      (this as { handle: any }).handle = null
    }
    return this
  }

  /**
   * Binds the texture to the gl context.
   */
  public use(): this {
    this.device.context.bindTexture(this.type, this.handle)
    return this
  }

  /**
   * Sets the texture source from an url.
   *
   * @remarks
   * The url is checked against the {@link Texture.videoTypes} array to detect
   * whether the url points to an image or video.
   */
  public setUrl(url: string): this {
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
  public setImageUrl(url: string, crossOrigin: string = this.crossOrigin): this {
    (this as {ready: boolean}).ready = false
    const image = new Image()
    image.crossOrigin = crossOrigin
    image.src = url
    this.setImage(image)
    return this
  }

  /**
   * Sets the texture source from a video url
   */
  public setVideoUrl(url: string, crossOrigin: string = this.crossOrigin): this {
    (this as {ready: boolean}).ready = false
    const video = document.createElement('video')
    video.src = url
    video.crossOrigin = crossOrigin
    video.load()
    this.setVideo(video)
    return this
  }

  /**
   * Sets the texture source from video urls.
   */
  public setVideoUrls(options: Array<{ src: string, type: string }>): this {
    (this as {ready: boolean}).ready = false
    const video = document.createElement('video')
    let valid = false
    for (let option of options) {
      if (video.canPlayType(option.type)) {
        video.src = option.src
        video.crossOrigin = this.crossOrigin
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
  public setImage(image: HTMLImageElement): this {
    (this as { image: any }).image = image;
    (this as { video: any }).video = null

    this.update()
    return this
  }

  /**
   * Sets the texture source from HTMLVideoElement
   */
  public setVideo(video: HTMLVideoElement): this {
    (this as { image: any }).image = null;
    (this as { video: any }).video = video

    this.update()
    return this
  }

  /**
   * Sets the texture source from data array or buffer
   *
   * @param data - The texture data to be set
   * @param width - The new texture width
   * @param height - The new texture height
   */
  public setData(data: TextureDataOption, width?: number, height?: number): this {
    (this as { image: any }).image = null;
    (this as { video: any }).video = null

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

    this.use()
    this.device.context.texImage2D(this.type, 0, this.pixelFormat, width, height, 0, this.pixelFormat, this.pixelType, buffer)
    if (this.generateMipmap) {
      this.device.context.generateMipmap(this.type)
    }

    (this as { width: any }).width = width;
    (this as { height: any }).height = height;
    (this as { ready: any }).ready = true;
    (this as { isPOT: any }).isPOT = isPowerOfTwo(width) && isPowerOfTwo(height)
    return this
  }

  /**
   * returns the result of `1 / texture.width`
   */
  public get texelX(): number {
    return 1.0 / this.width
  }

  /**
   * returns the result of `1 / texture.height`
   */
  public get texelY(): number {
    return 1.0 / this.height
  }

  /**
   * Returns both {@link Texture.texelX} and {@link Texture.texelY} as IVec2
   */
  public get texel(): IVec2 {
    return { x: 1.0 / this.width, y: 1.0 / this.height }
  }

  /**
   * Updates the texture from current image or video element.
   *
   * @remarks
   * This method is called automatically from inside the {@link ShaderUniform}
   *
   * When loading textures from url or html image/video elements
   * the texture data might not be available right away because the
   * resources may still be downloading.
   *
   * A call to this method instructs the texture to check the
   * download state of the resources and when available to update
   * the texture data. When data has arrived the {@link Texture.ready}
   * property will be set to `true`
   */
  public update() {
    if (this.image) {
      Texture.updateFromImage(this, this.image)
    }
    if (this.video) {
      Texture.updateFromVideo(this, this.video)
    }
  }

  private static updateFromImage(texture: Texture, image: HTMLImageElement) {
    if (texture.ready || !image || !image.complete) {
      return
    }

    const gl = texture.device.context
    gl.bindTexture(texture.type, texture.handle)
    gl.texImage2D(texture.type, 0, texture.pixelFormat, texture.pixelFormat, texture.pixelType, image)
    if (texture.generateMipmap) {
      gl.generateMipmap(texture.type)
    }
    gl.bindTexture(texture.type, null);

    (texture as { ready: any }).ready = true;
    (texture as { width: any }).width = image.naturalWidth;
    (texture as { height: any }).height = image.naturalHeight;
    (texture as { isPOT: any }).isPOT = isPowerOfTwo(texture.width) && isPowerOfTwo(texture.height)
  }

  private static updateFromVideo(texture: Texture, video: HTMLVideoElement) {
    if (!video || video.readyState < 3 || video.currentTime === texture.videoTime) {
      return
    }

    let gl = texture.device.context
    gl.bindTexture(texture.type, texture.handle)
    gl.texImage2D(texture.type, 0, texture.pixelFormat, texture.pixelFormat, texture.pixelType, video)
    if (texture.generateMipmap && texture.isPOT) {
      gl.generateMipmap(texture.type)
    }
    gl.bindTexture(texture.type, null);

    (texture as { ready: any }).ready = video.readyState >= 3;
    (texture as { width: any }).width = video.videoWidth;
    (texture as { height: any }).height = video.videoHeight;
    (texture as { isPOT: any }).isPOT = isPowerOfTwo(texture.width) && isPowerOfTwo(texture.height)
    texture.videoTime = video.currentTime
  }
}
