import { uuid } from '@gglib/utils'
import { Device } from '../Device'
import { surfaceFormatInfo, type SurfaceFormat, type TextureType, type TypedArray } from '../enums'
import type { ReferenceCounter } from './ReferenceCounter'
import type { ReferenceCounted } from './ResourceTracker'
import { DynamicTextureSource, type TextureSource } from './TextureSource'

export const TextureUsage = {
  TextureBinding: 0x04,
  StorageBinding: 0x08,
  RenderTarget: 0x10,
}

/**
 *
 * @public
 */
export type TextureDataOption = number[] | ArrayBuffer | ArrayBufferView<ArrayBuffer>

/**
 * @public
 */
export type TextureSourceOption = string | string[] | TexImageSource | TextureDataOption | TextureSource

export type TextyreUsage = number

export type AcquireTextureOptions = TextureOptions & {
  key: any
}

export interface TextureDescriptor {
  name?: string
  type: TextureType
  format: SurfaceFormat
  width: number
  height: number
  depth: number
  sampleCount: number
  mipLevelCount: number
  usage: number
}

export interface TextureOptions extends Partial<TextureDescriptor> {
  /**
   * User defined name
   */
  name?: string

  /**
   * The texture type
   */
  type?: TextureType

  /**
   * The internal surface format of the texture
   */
  format?: SurfaceFormat

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
   * Whether or not to automatically generate mip maps
   */
  generateMipmap?: boolean

  /**
   * The number of mip levels
   *
   * @remarks
   * If not specified, the value is determined from the texture dimensions.
   */
  mipLevelCount?: number

  /**
   * The number of samples per pixel when used as a render target
   */
  sampleCount?: number

  /**
   * Indicates intended usage of the texture. Defaults to {@link TextureUsage.TextureBinding}.
   */
  usage?: number

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
   * Value for the `crossOrigin` attribute to be used when fetching image or video by url
   *
   * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
   * {@link https://blog.chromium.org/2011/07/using-cross-domain-images-in-webgl-and.html}
   */
  crossOrigin?: string
}

/**
 * Selects a range of mip levels of a texture
 */
export interface TextureSubresourceRange {
  /**
   * First mip level of the range. Defaults to 0
   */
  baseMipLevel?: number
  /**
   * Number of mip levels in the range. Defaults to all remaining levels
   */
  mipLevelCount?: number
}

/**
 * A range of mip levels of a texture, that can be bound to a shader input instead of the whole texture.
 *
 * In the shader, mip level 0 of the input addresses {@link baseMipLevel} of the texture.
 * This allows to sample one mip level of a texture while rendering into another mip level of the same texture.
 *
 * @remarks
 * Views are created with {@link Texture.subresource} and are cached by the texture.
 *
 * WebGL2 has no texture views. The range is applied as `TEXTURE_BASE_LEVEL` and `TEXTURE_MAX_LEVEL`
 * of the texture object when it is bound, so a texture can not be bound with two different ranges in one draw.
 * Do not rely on `textureSize` in GLSL for a view with `baseMipLevel > 0`, ANGLE (D3D11) reports wrong sizes.
 * Pass the size as a uniform instead.
 */
export class TextureView {
  public constructor(
    public readonly texture: Texture,
    public readonly baseMipLevel: number,
    public readonly mipLevelCount: number,
  ) {}

  /**
   * Whether the view covers all mip levels of the texture
   */
  public get isFullRange() {
    return this.baseMipLevel === 0 && this.mipLevelCount === this.texture.mipLevelCount
  }

  /**
   * Width of the base mip level of this view
   */
  public get width() {
    return Math.max(1, this.texture.width >> this.baseMipLevel)
  }

  /**
   * Height of the base mip level of this view
   */
  public get height() {
    return Math.max(1, this.texture.height >> this.baseMipLevel)
  }
}

export abstract class Texture implements ReferenceCounted {
  /**
   * Value for the `crossOrigin` attribute to be used when fetching image or video by url
   *
   * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
   * {@link https://blog.chromium.org/2011/07/using-cross-domain-images-in-webgl-and.html}
   */
  public static crossOrigin: string = 'anonymous'

  /**
   * Unique resource id
   */
  public readonly uid: string = uuid()

  /**
   * User defined name
   */
  public name: string

  /**
   * The device instance
   */
  public abstract readonly device: Device

  /**
   * The texture width
   */
  public readonly width: number = 1

  /**
   * The texture height
   */
  public readonly height: number = 1

  /**
   * The texture depth
   *
   * @remarks
   * Only used for 3D textures and 2D array textures.
   */
  public readonly depth: number = 1

  /**
   * Indicates whether mip maps should be generated.
   */
  public readonly generateMipmap: boolean = false

  /**
   * The number of mip levels in this texture
   */
  public readonly mipLevelCount: number

  /**
   * The number of samples when used as a render target
   */
  public readonly sampleCount: number

  /**
   * Indicates the used pixel format.
   */
  public readonly format: SurfaceFormat = 'rgba8unorm'

  /**
   * Indicates the texture type
   */
  public readonly type: TextureType = '2d'

  /**
   * The data source for this texture
   */
  public readonly source: TextureSource = null

  /**
   * Estimated size of the texture in bytes. This is not necessarily the actual size of the texture in GPU memory, but can be used for budgeting purposes.
   */
  public readonly sizeInBytes: number = 0

  /**
   *  Indicates whether this texture is compressed.
   */
  public readonly isCompressed: boolean = false

  /**
   * Indicates whether this texture can be used as a source for sampling in a shader
   */
  public abstract readonly isSampled: boolean

  /**
   * Indicates whether this texture can be used as a render target
   */
  public abstract readonly isRenderTarget: boolean

  /**
   * Indicates whether this texture is multisampled
   */
  public abstract readonly isMultisampled: boolean

  /**
   *
   */
  public abstract readonly ref: ReferenceCounter

  /**
   * Value for the `crossOrigin` attribute to be used when fetching image or video by url
   *
   * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
   * {@link https://blog.chromium.org/2011/07/using-cross-domain-images-in-webgl-and.html}
   */
  public readonly crossOrigin: string = Texture.crossOrigin

  /**
   * Collection of file extensions that are recognized as video files.
   */
  public static videoTypes = ['.mp4', '.ogv', '.ogg', '.webm']
  hasStencil: any

  /**
   * Releases all resources and notifies the device that the texture is being destroyed.
   */
  public abstract dispose(): void

  /**
   * Generates mipmaps for this texture.
   */
  public abstract updateMipmaps(): void

  /**
   * Sets the texture from a given source
   */
  public abstract setDataFromSource(source: TextureSourceOption): void

  /**
   * Reads the texture data as a typed array. The type of the array is determined by the texture format.
   *
   * @param x
   * @param y
   * @param width
   * @param height
   */
  public abstract readPixels(x?: number, y?: number, width?: number, height?: number): Promise<TypedArray>

  /**
   * Reads the texture as uint8clamped array. This is useful for creating an ImageData object from the texture data.
   *
   * @param x
   * @param y
   * @param width
   * @param height
   */
  public abstract readPixelData(
    x?: number,
    y?: number,
    width?: number,
    height?: number,
  ): Promise<Uint8ClampedArray<ArrayBuffer>>

  protected bindSource(source: TextureSource) {
    this.unbindSource()
    if (!source) {
      return null
    }
    let isReady = true
    if (source instanceof DynamicTextureSource) {
      isReady = source.isReady
      source.on('ready', this.onSourceReady)
      source.on('change', this.onSourceChange)
    }
    if (isReady) {
      this.onSourceReady(source)
    }
  }

  protected unbindSource() {
    const source = this.source
    if (!source) {
      return
    }
    if (source instanceof DynamicTextureSource) {
      source.off('ready', this.onSourceReady)
      source.off('change', this.onSourceChange)
    }
  }

  protected onSourceReady = (source: TextureSource) => {
    if (source instanceof DynamicTextureSource && !source.isReady) {
      return
    }
    if (source) {
      this.setDataFromSource(source)
    }
  }

  protected onSourceChange = (source: TextureSource) => {
    if (source instanceof DynamicTextureSource && !source.isReady) {
      return
    }
    if (source) {
      this.setDataFromSource(source)
    }
  }

  public abstract resize(width: number, height: number, depth?: number): void

  private views = new Map<number, TextureView>()

  /**
   * Gets a view of a range of mip levels of this texture, that can be bound to a shader input.
   * Views are cached, the same range returns the same instance.
   *
   * @see {@link TextureView}
   */
  public subresource(range: TextureSubresourceRange): TextureView {
    const base = range.baseMipLevel ?? 0
    const count = range.mipLevelCount ?? this.mipLevelCount - base
    if (base < 0 || count < 1 || base + count > this.mipLevelCount) {
      throw new Error(
        `Invalid subresource range: baseMipLevel=${base} mipLevelCount=${count} for texture with ${this.mipLevelCount} mip levels`,
      )
    }
    // mip level count is limited to 32 (2^32 texture size)
    const key = base * 32 + count
    let view = this.views.get(key)
    if (!view) {
      view = new TextureView(this, base, count)
      this.views.set(key, view)
    }
    return view
  }

  public resizeToMatch(other: { width: number; height: number }) {
    this.resize(other.width, other.height)
  }

  public estimateSize(): number {
    let total = 0

    const format = surfaceFormatInfo(this.format)
    for (let level = 0; level < this.mipLevelCount; level++) {
      const w = Math.max(1, this.width >> level)
      const h = Math.max(1, this.height >> level)

      const blocksX = Math.ceil(w / format.blockWidth)
      const blocksY = Math.ceil(h / format.blockHeight)

      total += blocksX * blocksY * format.bytesPerBlock
    }

    return total * this.depth * this.sampleCount
  }
}

export function isTextureSourceOption(value: any): value is TextureOptions {
  return value && typeof value === 'object' && 'source' in value && !(value instanceof Texture)
}

export function isAquirableTextureOptions(value: any): value is AcquireTextureOptions {
  if (!isTextureSourceOption(value)) {
    return false
  }
  return 'key' in value
}
