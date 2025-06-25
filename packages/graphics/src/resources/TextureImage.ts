import { uuid } from '@gglib/utils'
import { Device } from '../Device'
import { DepthFormat, SurfaceFormat, surfaceFormatIsCompressed, TextureType } from '../enums'
import { SamplerStateParams } from '../states'
import { TextureOptions } from './Texture'
import { createTextureSource, TextureSource } from './TextureSource'

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
   * User defined name
   */
  name?: string

  /**
   * Whether or not to automatically generate mip maps
   */
  generateMipmap?: boolean

  /**
   * The sampler state to be used together with this texture e.g. for generating mip maps.
   */
  sampler?: SamplerStateParams

  /**
   * The internal surface format of the texture
   */
  format?: SurfaceFormat

  /**
   * The texture type
   */
  type?: TextureType

  /**
   * The texture width
   *
   * @remarks
   * If not specified, the value is determined from the {@link source} data.
   */
  width?: number

  /**
   * The texture height
   *
   * @remarks
   * If not specified, the value is determined from the {@link source} data.
   */
  height?: number

  /**
   * The texture depth
   *
   * @remarks
   * Only used for 3D textures and 2D array textures.
   * If not specified, the value is determined from number of attached {@link source} data.
   */
  depth?: number

  /**
   * The texture data source
   *
   * @remarks
   * - For 2D textures, this must be an array with length 1.
   * - For Cube textures, this must be an array with length 6, one source for each face.
   * - For 3D textures, this can ben arbitrary length, one for each depth slice.
   */
  source?: TextureSourceOption

  /**
   * The depth format of the depth stencil buffer to use when the texture is used as a render target
   */
  depthFormat?: DepthFormat

  /**
   * Value for the `crossOrigin` attribute to be used when fetching image or video by url
   *
   * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
   * {@link https://blog.chromium.org/2011/07/using-cross-domain-images-in-webgl-and.html}
   */
  crossOrigin?: string
}

export type RenderTargetOptions = Omit<TextureOptions, 'source' | 'crossOrigin' | 'generateMipmap' | 'type'>

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
   * The texture depth
   *
   * @remarks
   * Only used for 3D textures and 2D array textures.
   */
  public readonly depth: number

  /**
   * Indicates whether texture data has been set
   *
   * @remarks
   * If the texture data must be loaded asynchronously (e.g. image or video URL) this property will be false as long
   * as the data has not arrived. A shader should not attempt to bind this texture until the property is switched to true.
   */
  public readonly ready: boolean = false

  /**
   * Indicates whether mip maps should be generated.
   */
  public readonly generateMipmap: boolean = true

  /**
   * Indicates the used pixel format.
   */
  public readonly format: SurfaceFormat

  /**
   * The depths stencil format that should be used for render target
   *
   * @remarks
   * If this value is set, the texture is considered a render target.
   */
  public readonly depthFormat: DepthFormat

  /**
   * Indicates the texture type
   */
  public readonly type: TextureType = 'Texture2D'

  /**
   * The data source for this texture
   */
  public readonly source: TextureSource

  /**
   * Indicates whether this texture is a 2D array texture.
   */
  public readonly isArray: boolean

  /**
   *  Indicates whether this texture is compressed.
   */
  public readonly isCompressed: boolean = false

  /**
   * If used as render target this indicates the cubemap face that is currently being rendered to.
   */
  public targetFace: number = 0

  /**
   * If used as render target this indicates the mipmap level that is currently being rendered to.
   */
  public targetLevel: number = 0

  /**
   * Value for the `crossOrigin` attribute to be used when fetching image or video by url
   *
   * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
   * {@link https://blog.chromium.org/2011/07/using-cross-domain-images-in-webgl-and.html}
   */
  public readonly crossOrigin: string = TextureImage.crossOrigin

  /**
   * The sampler state parameters that should be used together with this texture e.g. for generating mip maps.
   */
  public readonly sampler: SamplerStateParams

  /**
   * Indicates whether this texture is intended to be used as a renter target
   */
  public get isRenderTarget(): boolean {
    return this.depthFormat != null
  }

  public get isCube() {
    return this.type === 'TextureCube'
  }

  public get is2D() {
    return this.type === 'Texture2D' || this.type === 'Texture2DArray'
  }

  public get is3D() {
    return this.type === 'Texture3D'
  }

  /**
   * Collection of file extensions that are recognized as video files.
   */
  public static videoTypes = ['.mp4', '.ogv', '.ogg', '.webm']

  public setup(options: TextureImageOptions): this {
    const width = options.width ?? this.width
    const height = options.height ?? this.height
    const depth = options.depth ?? this.depth

    const type = options?.type ?? this.type
    const format = (options?.format ?? this.format) || 'RGBA8_UNORM'
    const compressed = surfaceFormatIsCompressed(format)
    const depthFormat = options?.depthFormat ?? this.depthFormat

    const generateMipmap = options?.generateMipmap ?? this.generateMipmap
    const crossOrigin = options?.crossOrigin ?? this.crossOrigin

    if (
      width !== this.width ||
      height !== this.height ||
      depth !== this.depth ||
      type !== this.type ||
      format !== this.format ||
      depthFormat !== this.depthFormat
    ) {
      this.disposeResource()
    }

    this.set('isCompressed', compressed)
    this.set('sampler', options.sampler ?? this.sampler)
    this.set('name', options.name ?? this.name)
    this.set('width', width)
    this.set('height', height)
    this.set('depth', depth)
    this.set('type', type)
    this.set('format', format)
    this.set('depthFormat', depthFormat)
    this.set('generateMipmap', generateMipmap)
    this.set('ready', false)
    this.set('crossOrigin', crossOrigin)

    if (options.source) {
      this.set(
        'source',
        createTextureSource(options.source, {
          crossOrigin: crossOrigin,
          videoTypes: TextureImage.videoTypes,
          width: width,
          height: height,
          format: format,
        }),
      )
    }

    this.createResource()

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
   * Generates mipmaps for this texture.
   */
  public abstract updateMipmaps(): this

  /**
   * Sets the texture source from data array or buffer
   *
   * @param data - The texture data to be set
   * @param width - The new texture width
   * @param height - The new texture height
   */
  public abstract setData(data: TextureDataOption, width?: number, height?: number): this

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
  public abstract update(): void

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
