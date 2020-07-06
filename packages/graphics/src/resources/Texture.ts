import { IVec2 } from '@gglib/math'
import { getOption, isArray, isObject, isString, Log, uuid } from '@gglib/utils'
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
} from '../enums'

import { Device } from '../Device'
import { SamplerState, SamplerStateParams } from '../states/SamplerState'

/**
 * Type that is accepted by the {@link Texture.setData} method
 *
 * @public
 */
export type TextureDataOption = number[] | ArrayBuffer | ArrayBufferView

function isPowerOfTwo(value: number): boolean {
  return ((value > 0) && !(value & (value - 1))) // tslint:disable-line
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
  samplerParams?: SamplerStateParams
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
export abstract class Texture {

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
   * Value for the `crossOrigin` attribute to be used when fetching image or video by url
   *
   * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
   * {@link https://blog.chromium.org/2011/07/using-cross-domain-images-in-webgl-and.html}
   */
  public static crossOrigin: string

  /**
   * Unique resource id
   */
  public uid: string = uuid()

  /**
   * The device instance
   */
  public abstract readonly device: Device

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
  // public readonly handle: WebGLTexture = null

  /**
   * The sampler state of this texture. Always reflects current state of this texture.
   */
  public readonly sampler: SamplerState

  /**
   * The sampler state params that should always apply to this texture
   *
   * @remarks
   * If this is set, this state parameters will always be used with this texture
   * when assigning it to a texture unit. Other sampler states defined in a shader or
   * elsewhere will be ignored.
   *
   * Use this if you prefer the original way of handling sampling parameters in opengl.
   *
   * Don't use this if you want separate the concerns of texture and samplers.
   */
  public samplerParams: SamplerStateParams

  /**
   * Value for the `crossOrigin` attribute to be used when fetching image or video by url
   *
   * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
   * {@link https://blog.chromium.org/2011/07/using-cross-domain-images-in-webgl-and.html}
   */
  public readonly crossOrigin: string = Texture.crossOrigin

  /**
   * The recent video playback timestamp.
   */
  protected videoTime = -1

  protected depthFormatField: number

  /**
   * Depth stencil format if this is a render target
   */
  public get depthFormat(): number {
    return this.depthFormatField
  }
  public set depthFormat(value: number) {
    this.depthFormatField = value
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

    let type = valueOfTextureType(getOption(options, 'type', this.type))
    let pixelType = valueOfDataType(getOption(options, 'pixelType', this.pixelType))
    let pixelFormat = valueOfPixelFormat(getOption(options, 'pixelFormat', this.pixelFormat))
    let depthFormat = valueOfDepthFormat(getOption(options, 'depthFormat', this.depthFormat))
    let genMipMaps = getOption(options, 'generateMipmap', this.generateMipmap)
    let crossOrigin = getOption(options, 'crossOrigin', this.crossOrigin)
    let samplerParams = getOption(options, 'samplerParams', this.samplerParams)

    if (
      width !== this.width ||
      height !== this.height ||
      pixelFormat !== this.pixelFormat ||
      pixelType !== this.pixelType ||
      type !== this.type
    ) {
      this.destroy()
    }

    this.set('width', width)
    this.set('height', height)
    this.set('type', type)
    this.set('pixelType', pixelType)
    this.set('pixelFormat', pixelFormat)
    this.set('depthFormat', depthFormat)
    this.set('generateMipmap', genMipMaps)
    this.set('ready', false)
    this.set('crossOrigin', crossOrigin)
    this.set('samplerParams', samplerParams)
    if (!this.sampler) {
      this.set('sampler', this.device.createSamplerState({ texture: this }))
    }
    this.create()

    const source = options.data
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
      this.set('ready', true)
    }
    return this
  }

  public abstract create(): this

  /**
   * Releases all resources and notifies the device that the texture is being destroyed.
   */
  public abstract destroy(): this

  /**
   * Binds the texture to the gl context.
   *
   * @returns the previously bound texture handle
   */
  public abstract bind(): this

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
    this.set('ready', false)
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
    this.set('ready', false)
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
    this.set('ready', false)
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
    this.set('image', image)
    this.set('video', null)
    this.update()
    return this
  }

  /**
   * Sets the texture source from HTMLVideoElement
   */
  public setVideo(video: HTMLVideoElement): this {
    this.set('image', null)
    this.set('video', video)
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
  public abstract setData(data: TextureDataOption, width?: number, height?: number): this

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
  public abstract update(): this

  protected set<K extends keyof this>(key: K, value: this[K]) {
    (this as any)[key] = value
  }
}
