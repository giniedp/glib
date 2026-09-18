import { extname } from '@gglib/utils'
import type { SurfaceFormat } from '../enums'
import { toArrayBufferView } from './utils'

export type TextureFaceData = TexImageSource | ArrayBufferView | CompressedFaceData

export interface CompressedFaceData {
  data: ArrayBufferView
  rows: number
  bytesPerRow: number
}

export function isCompressedFaceData(data: any): data is CompressedFaceData {
  return data && 'data' in data && 'rows' in data && 'bytesPerRow' in data
}

export class TextureSource<T extends TextureFaceData = TextureFaceData> {
  /**
   * The width of the texture source.
   */
  public width: number

  /**
   * The height of the texture source.
   */
  public height: number

  /**
   * The texture data for each mipmap level.
   *
   * @remarks
   * Each element in the array is one mipmap level.
   *
   * - For cubemaps, each level has 6 elements. Each element is one face.
   * - For 2D textures, each level has 1 element.
   * - For 3D textures or 2D arrays, each level has more than 1 element. Each element is one layer.
   */
  public levels: Array<Array<T>>

  public constructor(options: { width: number; height: number; levels: Array<Array<T>> }) {
    this.width = options.width
    this.height = options.height
    this.levels = options.levels
  }
}

export abstract class DynamicTextureSource<T extends TextureFaceData = TextureFaceData> extends TextureSource<T> {
  /**
   * Indicates if the texture source is ready to use.
   */
  abstract readonly isReady: boolean

  private listeners: Record<'ready' | 'change', Array<(source: this) => void>> = {
    ready: [],
    change: [],
  }

  /**
   *
   */
  public on(event: 'ready' | 'change', listener: (source: this) => void): void {
    this.off(event, listener)
    this.listeners[event].push(listener)
  }

  /**
   *
   */
  public off(event: 'ready' | 'change', listener: (source: this) => void): void {
    const index = this.listeners[event].indexOf(listener)
    if (index >= 0) {
      this.listeners[event].splice(index, 1)
    }
  }

  protected trigger(event: 'ready' | 'change'): void {
    for (const listener of this.listeners[event]) {
      try {
        listener(this)
      } catch (e) {
        console.error(e)
      }
    }
  }

  public dispose() {
    this.listeners.change.length = 0
    this.listeners.ready.length = 0
  }
}

export function createImageBitmapOptions(options?: ImageBitmapOptions): ImageBitmapOptions {
  const result: ImageBitmapOptions = {
    colorSpaceConversion: options?.colorSpaceConversion ?? 'none',
    imageOrientation: options?.imageOrientation ?? 'none',
    premultiplyAlpha: options?.premultiplyAlpha ?? 'none',
  }
  if (options?.resizeWidth && options?.resizeHeight) {
    result.resizeWidth = options.resizeWidth
    result.resizeHeight = options.resizeHeight
    result.resizeQuality = options.resizeQuality ?? 'high'
  }
  return result
}
export class ImageBitmapTextureSource extends DynamicTextureSource<ImageBitmap> {
  public isReady: boolean

  public constructor(
    resource: string | string[] | ImageBitmapSource | Array<ImageBitmapSource>,
    options?: ImageBitmapOptions,
  ) {
    super({
      width: options?.resizeWidth,
      height: options?.resizeHeight,
      levels: [],
    })
    const list = Array.isArray(resource) ? resource : [resource]
    async function transformSource(it: string | ImageBitmapSource): Promise<ImageBitmapSource> {
      if (typeof it === 'string' || it instanceof URL) {
        return fetch(it).then((res) => res.blob())
      }
      if (it instanceof Image) {
        await it.decode()
      }
      return it
    }
    options = createImageBitmapOptions(options)
    Promise.all(
      list.map(async (it) => {
        const source = await transformSource(it)
        return createImageBitmap(source, options)
      }),
    ).then((images) => {
      this.isReady = true
      this.width = images[0].width
      this.height = images[0].height
      this.levels = [images]

      this.trigger('ready')
      this.trigger('change')
    })
  }

  public override dispose(): void {
    super.dispose()
    for (const level of this.levels) {
      for (const image of level) {
        image.close()
      }
    }
  }
}

export class ImageElementTextureSource extends DynamicTextureSource<HTMLImageElement> {
  public isReady: boolean

  public constructor(resource: HTMLImageElement | Array<HTMLImageElement>, options?: TextureSourceOptions) {
    super({
      width: options?.width,
      height: options?.height,
      levels: [Array.isArray(resource) ? resource : [resource]],
    })
    const list = this.levels[0]
    Promise.all(list.map((it) => it.decode().then(() => it))).then((el) => {
      this.isReady = true
      this.width ??= list[0].naturalWidth
      this.height ??= list[0].naturalHeight
      if (!list.every((it) => it.naturalWidth === list[0].naturalWidth && it.naturalHeight === list[0].naturalHeight)) {
        throw new Error(`All image source must have same dimensions`)
      }

      this.trigger('ready')
      this.trigger('change')
    })
  }
}

export class VideoElementTextureSource extends DynamicTextureSource<HTMLVideoElement> {
  public get isReady() {
    return this.video.readyState >= 3
  }

  public video: HTMLVideoElement
  public videoTime: number = null
  public videoState: number = null
  public videoFrame: number = null

  public constructor(resource: HTMLVideoElement) {
    super({
      width: resource.videoWidth,
      height: resource.videoHeight,
      levels: [[resource]],
    })

    this.video = resource
    this.videoFrame = this.video.requestVideoFrameCallback(this.handleVideoFrame)
  }

  private handleVideoFrame = () => {
    const wasReady = this.videoState >= 3
    const isReady = this.video.readyState >= 3
    const changed = this.video.currentTime !== this.videoTime
    this.videoTime = this.video.currentTime
    this.width = this.video.videoWidth
    this.height = this.video.videoHeight
    if (isReady) {
      if (!wasReady) {
        this.trigger('ready')
      }
      if (changed) {
        this.trigger('change')
      }
    }
    this.videoFrame = this.video.requestVideoFrameCallback(this.handleVideoFrame)
  }

  public override dispose(): void {
    super.dispose()
    this.video.cancelVideoFrameCallback(this.videoFrame)
    this.video.pause()
  }
}

export type TextureSourceInput =
  | number[]
  | ArrayBuffer
  | ArrayBufferView<ArrayBuffer>
  | string
  | string[]
  | TexImageSource
  | ImageBitmap
  | ImageData
  | HTMLCanvasElement
  | TextureSource

export interface TextureSourceOptions {
  /**
   * Value for crossOrigin attribute for HTML Image source
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/crossOrigin
   */
  crossOrigin?: string
  /**
   * List of extension names that identify video URLs
   */
  videoTypes?: string[]
  /**
   * Source width e.g. array buffer
   */
  width?: number
  /**
   * Source height e.g. array buffer
   */
  height?: number
  /**
   * Source data format e.g. array buffer
   */
  format?: SurfaceFormat
}

export function createTextureSource(source: TextureSourceInput, options?: TextureSourceOptions): TextureSource {
  if (!source) {
    return null
  }

  if (typeof source === 'string') {
    return textureSourceFromUrl(source, options)
  }

  if (Array.isArray(source) && source.every((it) => typeof it === 'string')) {
    return createImageTextureSource(source, {
      crossOrigin: options?.crossOrigin,
    })
  }

  if (Array.isArray(source) && typeof source[0] === 'object') {
    return createVideoTextureSource(source as any, {
      crossOrigin: options?.crossOrigin,
    })
  }

  if (source instanceof TextureSource) {
    return source
  }

  if (source instanceof HTMLImageElement) {
    return new ImageElementTextureSource(source, options)
  }

  if (source instanceof HTMLVideoElement) {
    return new VideoElementTextureSource(source)
  }

  if ('width' in source && 'height' in source) {
    return new TextureSource({
      levels: [[source]],
      width: source.width,
      height: source.height,
    })
  }

  if (source && (source instanceof Array || source instanceof ArrayBuffer || 'buffer' in source)) {
    if (!options.width || !options.height) {
      throw new Error(`Invalid options for creating texture source. Width and height must be specified.`)
    }
    if (!options.format) {
      throw new Error(`Invalid options for creating texture source. surfaceFormat must be specified.`)
    }
    return new TextureSource({
      levels: [[toArrayBufferView(source, options.format)]],
      width: options.width,
      height: options.height,
    })
  }

  return null
}

export function textureSourceFromUrl(url: string, options?: TextureSourceOptions) {
  const ext = extname(url)
  const isVideo = options?.videoTypes && options.videoTypes.indexOf(ext) >= 0
  if (isVideo) {
    return createVideoTextureSource(url, {
      crossOrigin: options?.crossOrigin!,
    })
  }
  return createImageTextureSource(url, options)
}

export function createImageTextureSource(
  url: string | string[] | HTMLImageElement | HTMLImageElement[],
  options?: {
    crossOrigin?: string
  } & ImageBitmapOptions,
) {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmapTextureSource(url, options)
  }
  return createImageElementTextureSource(url, options)
}

/**
 * Creates a texture source that fetches data from an URL or image element.
 *
 * Requires browser to support `createImageBitmap`.
 */
export function createImageBitmapTextureSource(
  url: string | string[] | HTMLImageElement | HTMLImageElement[],
  options?: ImageBitmapOptions,
) {
  return new ImageBitmapTextureSource(url, options)
}

/**
 * Creates a texture source that loads an HTML Image Element first
 */
export function createImageElementTextureSource(
  url: string | string[] | HTMLImageElement | HTMLImageElement[],
  options?: {
    crossOrigin?: string
  },
) {
  const urls = Array.isArray(url) ? url : [url]
  const images = urls.map((it) => {
    let image: HTMLImageElement
    if (typeof it === 'string') {
      image = new Image()
      image.crossOrigin = options.crossOrigin
      image.src = it
    } else {
      image = it
    }
    return image
  })
  return new ImageElementTextureSource(images)
}

export interface CreateVideoTextureOptions {
  crossOrigin?: string
  autoload?: boolean
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  volume?: number
}
/**
 * Creates a video texture source from a video URL
 */
export function createVideoTextureSource(
  videoOrUrl: string,
  options?: CreateVideoTextureOptions,
): VideoElementTextureSource
/**
 * Creates a video texture source from a video Element
 */
export function createVideoTextureSource(
  videoOrUrl: HTMLVideoElement,
  options?: CreateVideoTextureOptions,
): VideoElementTextureSource
/**
 * Creates a video texture source form the first video type that is supported.
 */
export function createVideoTextureSource(
  videoOrUrl: Array<{ src: string; type: string }>,
  options?: CreateVideoTextureOptions,
): VideoElementTextureSource
export function createVideoTextureSource(
  videoOrUrl: string | HTMLVideoElement | Array<{ src: string; type: string }>,
  options?: CreateVideoTextureOptions,
): VideoElementTextureSource {
  let video: HTMLVideoElement
  options ||= {}
  if (typeof videoOrUrl === 'string') {
    video = document.createElement('video')
    video.autoplay = options.autoplay ?? true
    video.src = videoOrUrl
  } else if (!Array.isArray(videoOrUrl)) {
    video = videoOrUrl
  } else {
    video = document.createElement('video')

    let valid = false
    for (let option of videoOrUrl) {
      if (video.canPlayType(option.type)) {
        video.src = option.src
        valid = true
        break
      }
    }
    if (!valid) {
      console.warn("[Texture] no supported format found. Video won't play.", options)
    }
  }
  if (options?.crossOrigin) {
    video.crossOrigin = options?.crossOrigin
  }
  video.loop = options.loop ?? video.loop
  video.muted = options.muted ?? video.muted
  video.volume = options.volume ?? video.volume
  video.autoplay = options.autoplay ?? !!video.autoplay
  return new VideoElementTextureSource(video)
}
