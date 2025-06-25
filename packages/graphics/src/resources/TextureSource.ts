import { Log, Uri } from '@gglib/utils'
import { toArrayBufferView } from './utils'
import { SurfaceFormat } from '../enums'

export type TextureData = TexImageSource | ArrayBufferView

export abstract class TextureSource<T extends TextureData = TextureData> {
  /**
   * Indicates whether the texture source is ready to be used.
   */
  abstract readonly isReady: boolean

  /**
   * The width of the texture source.
   */
  abstract readonly width: number

  /**
   * The height of the texture source.
   */
  abstract readonly height: number

  /**
   * The texture data for each mipmap level.
   *
   * @remarks
   * Each level is an array of texture data, where each element represents a layer or face of the texture.
   *
   * - For cubemaps, each level will contain 6 elements (one for each face).
   * - For 2D textures, each level will contain a single element.
   * - For 3D textures or 2D arrays, each level will contain multiple elements (one for each layer).
   */
  abstract readonly levels: Array<Array<T>>

  /**
   * The original resource from which the texture source was created.
   */
  public abstract resource: unknown

  /**
   * Runs an update on the texture source which allows it to perform the isReady check and update its state.
   *
   * @remarks
   * This is a no-op for static sources like ImageData or ArrayBufferView.
   * For dynamic sources like HTMLImageElement or HTMLVideoElement, this method should be called to check if the source has changed.
   */
  abstract update(): boolean
}

export class ImageElementSource extends TextureSource<HTMLImageElement> {
  public get isReady() {
    return this.resource.complete
  }
  public get width() {
    return this.resource.naturalWidth
  }
  public get height() {
    return this.resource.naturalHeight
  }
  public readonly levels: HTMLImageElement[][]

  public readonly resource: HTMLImageElement

  public constructor(resource: HTMLImageElement) {
    super()
    this.resource = resource
    this.resource.addEventListener('load', () => (this.hasChanged = true))
    this.levels = [[this.resource]]
  }

  public hasChanged = false
  public update(): boolean {
    if (this.hasChanged) {
      this.hasChanged = false
      return true
    }
    return false
  }
}

export class VideoElementSource extends TextureSource<HTMLVideoElement> {
  public get isReady() {
    return this.resource.readyState >= 3
  }
  public get width() {
    return this.resource.videoWidth
  }
  public get height() {
    return this.resource.videoHeight
  }
  public readonly levels: [[HTMLVideoElement]]

  public readonly resource: HTMLVideoElement
  public constructor(resource: HTMLVideoElement) {
    super()
    this.resource = resource
    this.levels = [[resource]]
  }

  private videoTime: number = null

  public update(): boolean {
    if (!this.isReady) {
      return false
    }
    const changed = this.resource.currentTime !== this.videoTime
    this.videoTime = this.resource.currentTime
    return changed
  }
}

function isImageBitmap(it: any): it is ImageBitmap {
  return typeof ImageBitmap !== 'undefined' && it instanceof ImageBitmap
}

export class ImageDataSource extends TextureSource<ImageBitmap | ImageData | HTMLCanvasElement | OffscreenCanvas> {
  public get isReady() {
    return true
  }
  public get width() {
    return this.resource.width
  }
  public get height() {
    return this.resource.height
  }
  public readonly levels: Array<Array<ImageBitmap | ImageData | HTMLCanvasElement | OffscreenCanvas>>

  public hasChanged = true

  public readonly resource: ImageBitmap | ImageData | HTMLCanvasElement | OffscreenCanvas

  public constructor(data: ImageBitmap | ImageData | HTMLCanvasElement | OffscreenCanvas) {
    super()
    if (
      isImageBitmap(data) ||
      data instanceof ImageData ||
      data instanceof HTMLCanvasElement ||
      data instanceof OffscreenCanvas
    ) {
      this.resource = data
      this.levels = [[this.resource]]
    } else if ('data' in data && 'width' in data && 'height' in data) {
      const input = data as ImageData
      this.resource = new ImageData(input.data, input.width, input.height)
      this.levels = [[this.resource]]
    } else {
      throw new Error()
    }
  }

  public update(): boolean {
    if (this.hasChanged) {
      this.hasChanged = false
      return true
    }
    return false
  }
}

export class ArrayBufferViewSource extends TextureSource<ArrayBufferView> {
  public get isReady() {
    return true
  }
  public readonly width: number
  public readonly height: number
  public readonly levels: Array<Array<ArrayBufferView>>

  public hasChanged = true

  public get resource() {
    return this.levels
  }

  public constructor(levels: Array<Array<ArrayBufferView>>, width: number, height: number) {
    super()
    this.levels = levels
    this.width = width
    this.height = height
  }

  public update(): boolean {
    if (this.hasChanged) {
      this.hasChanged = false
      return true
    }
    return false
  }
}

export type TextureSourceInput =
  | number[]
  | ArrayBuffer
  | ArrayBufferView<ArrayBuffer>
  | string
  | TexImageSource
  | ImageBitmap
  | ImageData
  | HTMLCanvasElement
  | TextureSource

export interface CreateTextureSourceOptions {
  crossOrigin?: string
  videoTypes?: string[]
  width?: number
  height?: number
  format?: SurfaceFormat
}

export function createTextureSource(source: TextureSourceInput, options?: CreateTextureSourceOptions): TextureSource {
  if (!source) {
    return null
  }

  if (typeof source === 'string') {
    return textureSourceFromUrl(source, options)
  }

  if (Array.isArray(source) && typeof source[0] === 'object') {
    return textureSourceFromVideoUrls(source as any)
  }

  if (source instanceof TextureSource) {
    return source
  }

  if (source instanceof HTMLImageElement) {
    return new ImageElementSource(source)
  }

  if (source instanceof HTMLVideoElement) {
    return new VideoElementSource(source)
  }

  if ('width' in source && 'height' in source) {
    return new ImageDataSource(source)
  }

  if (source && (source instanceof Array || source instanceof ArrayBuffer || 'buffer' in source)) {
    if (!options.width || !options.height) {
      throw new Error(`Invalid options for creating texture source. Width and height must be specified.`)
    }
    if (!options.format) {
      throw new Error(`Invalid options for creating texture source. surfaceFormat must be specified.`)
    }
    return new ArrayBufferViewSource([[toArrayBufferView(source, options.format)]], options.width, options.height)
  }

  return null
}

export function textureSourceFromUrl(url: string, options?: CreateTextureSourceOptions) {
  const ext = Uri.ext(url)
  const isVideo = options?.videoTypes && options.videoTypes.indexOf(ext) >= 0
  if (isVideo) {
    return textureSourceFromVideoUrl(url, options?.crossOrigin)
  }
  return textureSourceFromImageUrl(url, options?.crossOrigin)
}

export function textureSourceFromImageUrl(url: string, crossOrigin?: string) {
  const image = new Image()
  image.crossOrigin = crossOrigin
  image.src = url
  return new ImageElementSource(image)
}

export function textureSourceFromVideoUrl(url: string, crossOrigin: string) {
  const video = document.createElement('video')
  video.src = url
  video.crossOrigin = crossOrigin
  video.load()
  return new VideoElementSource(video)
}

export function textureSourceFromVideoUrls(options: Array<{ src: string; type: string }>) {
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
    Log.warn("[Texture] no supported format found. Video won't play.", options)
  }
  return new VideoElementSource(video)
}
