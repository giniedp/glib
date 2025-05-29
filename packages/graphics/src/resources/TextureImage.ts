import { uuid } from '@gglib/utils'
import {
  DataType,
  DataTypeOption,
  DepthFormatOption,
  nameOfDataType,
  nameOfPixelFormat,
  nameOfTextureType,
  PixelFormat,
  PixelFormatOption,
  SurfaceFormat,
  SurfaceFormatOption,
  TextureType,
  TextureTypeOption,
  valueOfDataType,
  valueOfDepthFormat,
  valueOfPixelFormat,
  valueOfSurfaceFormat,
  valueOfTextureType,
} from '../enums'

import { Device } from '../Device'
import {
  createTextureSource,
  ImageDataSource,
  ImageElementSource,
  TextureSource,
  VideoElementSource,
} from './TextureSource'
import { TextureOptions } from './Texture'

/**
 * Type that is accepted by the {@link TextureImage.setData} method
 *
 * @public
 */
export type TextureDataOption = number[] | ArrayBuffer | ArrayBufferView<ArrayBuffer>

/**
 * @public
 */
export type TextureSourceOption = string | TexImageSource | TextureDataOption | TextureSource

/**
 * Constructor options for {@link TextureImage}
 *
 * @public
 */
export interface TextureImageOptions {

  /**
   * Whether or not to automatically generate mip maps
   */
  generateMipmap?: boolean

  /**
   * The internal surface format of the texture
   */
  surfaceFormat?: SurfaceFormatOption

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
   *
   * @remarks
   * The width is only used if the widht of the {@link source} data can not be determined.
   * This is the case when {@link source} is an ArrayBuffer or array
   */
  width?: number

  /**
   * The texture height
   *
   * @remarks
   * The width is only used if the height of the {@link source} data can not be determined.
   * This is the case when {@link source} is an ArrayBuffer or array
   */
  height?: number

  /**
   * The texture data source
   */
  source?: TextureSourceOption

  /**
   * The faces for a Cube Texture
   */
  faces?: Array<TextureSourceOption>

  /**
   * The depth format of the depth stencil buffer to use when the texture is used as a render target
   */
  depthFormat?: DepthFormatOption

  /**
   * Value for the `crossOrigin` attribute to be used when fetching image or video by url
   *
   * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
   * {@link https://blog.chromium.org/2011/07/using-cross-domain-images-in-webgl-and.html}
   */
  crossOrigin?: string
}

export type RenderTargetOptions = Omit<
  TextureOptions,
  'source' | 'crossOrigin' | 'generateMipmap' | 'type' | 'faces'
>

/**
 * Describes a texture object.
 *
 * @public
 */
export abstract class TextureImage {
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
   * User defined name
   */
  public name: string

  /**
   * Meta data and annotations
   */
  public meta: Record<string, any> = {}

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
  public readonly ready: boolean = false

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
  public readonly surfaceFormat: SurfaceFormat

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
   * The data source for this texture
   */
  public readonly source: TextureSource

  /**
   * The faces of a cube texture
   */
  public readonly faces: TextureImage[] = null

  /**
   * Returns the video element if the {@link source} is an instance of {@link VideoElementSource}
   */
  public get video(): HTMLVideoElement {
    if (this.source instanceof VideoElementSource) {
      return this.source.data
    }
  }

  /**
   * Value for the `crossOrigin` attribute to be used when fetching image or video by url
   *
   * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
   * {@link https://blog.chromium.org/2011/07/using-cross-domain-images-in-webgl-and.html}
   */
  public readonly crossOrigin: string = TextureImage.crossOrigin

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
   * Gets the name of {@link TextureImage.pixelFormat}
   */
  public get pixelFormatName(): string {
    return nameOfPixelFormat(this.pixelFormat)
  }

  /**
   * Gets the name of {@link TextureImage.pixelType}
   */
  public get pixelTypeName(): string {
    return nameOfDataType(this.pixelType)
  }

  /**
   * Gets the name of {@link TextureImage."type"}
   */
  public get typeName(): string {
    return nameOfTextureType(this.type)
  }

  public get isCube() {
    return this.type === TextureType.TextureCube
  }

  public get is2D() {
    return this.type === TextureType.Texture2D
  }

  /**
   * Collection of file extensions that are recognized as video files.
   */
  public static videoTypes = ['.mp4', '.ogv', '.ogg', '.webm']

  public setup(options: TextureImageOptions): this {
    let width = options.width || this.width
    let height = options.height || this.height

    let givenType = options?.type ?? this.type
    let type = valueOfTextureType(options?.type ?? this.type)
    if (type == null && typeof givenType === 'number') {
      type = givenType
    }

    let pixelType = valueOfDataType(options?.pixelType ?? this.pixelType)
    let pixelFormat = valueOfPixelFormat(options?.pixelFormat ?? this.pixelFormat)
    let surfaceFormat = valueOfSurfaceFormat(options?.surfaceFormat ?? this.surfaceFormat) || pixelFormat
    let depthFormat = valueOfDepthFormat(options?.depthFormat ?? this.depthFormat)
    let genMipMaps = options?.generateMipmap ?? this.generateMipmap
    let crossOrigin = options?.crossOrigin ?? this.crossOrigin

    if (
      width !== this.width ||
      height !== this.height ||
      surfaceFormat !== this.surfaceFormat ||
      pixelFormat !== this.pixelFormat ||
      pixelType !== this.pixelType ||
      type !== this.type
    ) {
      this.disposeResource()
    }

    this.set('width', width)
    this.set('height', height)
    this.set('type', type)
    this.set('pixelType', pixelType)
    this.set('pixelFormat', pixelFormat)
    this.set('surfaceFormat', surfaceFormat as SurfaceFormat)
    this.set('depthFormat', depthFormat)
    this.set('generateMipmap', genMipMaps)
    this.set('ready', false)
    this.set('crossOrigin', crossOrigin)
    this.set(
      'source',
      createTextureSource(options.source, {
        crossOrigin: crossOrigin,
        videoTypes: TextureImage.videoTypes,
        width: width,
        height: height,
        type: pixelType,
      }),
    )
    this.createResource()

    const faces = options?.faces ?? null
    if (faces && this.type === TextureType.TextureCube) {
      this.setFaces(faces)
      return this
    }

    return this
  }

  protected abstract disposeResource(): void
  protected abstract createResource(): void

  /**
   * Releases all resources and notifies the device that the texture is being destroyed.
   */
  public abstract dispose(): this

  /**
   * Binds the texture to the gl context.
   *
   * @returns the previously bound texture handle
   */
  public abstract bind(): this

  /**
   * Sets the texture source from HtmlImageElement
   */
  public setSource(value: TexImageSource | TextureSource): this {
    let source: TextureSource
    if (value instanceof TextureSource) {
      source = value
    } else if (value instanceof HTMLImageElement) {
      source = new ImageElementSource(value)
    } else if (value instanceof HTMLVideoElement) {
      source = new VideoElementSource(value)
    } else if (value) {
      source = new ImageDataSource(value as any)
    }
    this.set('source', source)
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
   * Sets the cubemap faces
   *
   * @param faces - The source options for each face
   */
  public abstract setFaces(faces: TextureSourceOption[]): this

  /**
   * Updates the texture from current source element.
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
   * the texture data. When data has arrived the {@link TextureImage.ready}
   * property will be set to `true`
   */
  public abstract update(): boolean

  /**
   * Resizes the render target
   *
   * @param width - The new width
   * @param height - The new height
   */
  public resize(width: number, height: number): void {
    if (this.ready && (width !== this.width || height !== this.height)) {
      this.setup({ width, height, type: this.type })
    }
  }

  protected set<K extends keyof this>(key: K, value: this[K]) {
    this[key] = value
  }
}
