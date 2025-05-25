import { Log, Uri } from '@gglib/utils'
import { ArrayType, DataTypeOption } from '../enums'


export abstract class TextureSource<T extends TexImageSource | ArrayBufferView = TexImageSource | ArrayBufferView> {
  abstract readonly isReady: boolean
  abstract readonly width: number
  abstract readonly height: number
  abstract readonly data: T

  abstract update(): boolean
}

export class ImageElementSource extends TextureSource<HTMLImageElement> {
  public get isReady() {
    return this.data.complete
  }
  public get width() {
    return this.data.naturalWidth
  }
  public get height() {
    return this.data.naturalHeight
  }
  public readonly data: HTMLImageElement

  public constructor(data: HTMLImageElement) {
    super()
    this.data = data
    this.data.addEventListener('load', () => (this.hasChanged = true))
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
    return this.data.readyState >= 3
  }
  public get width() {
    return this.data.videoWidth
  }
  public get height() {
    return this.data.videoHeight
  }
  public readonly data: HTMLVideoElement

  public constructor(data: HTMLVideoElement) {
    super()
    this.data = data
  }

  private videoTime: number = null

  public update(): boolean {
    if (!this.isReady) {
      return false
    }
    return this.data.currentTime !== this.videoTime
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
    return this.data.width
  }
  public get height() {
    return this.data.height
  }
  public readonly data: ImageBitmap | ImageData | HTMLCanvasElement | OffscreenCanvas

  public hasChanged = true

  public constructor(data: ImageBitmap | ImageData | HTMLCanvasElement | OffscreenCanvas) {
    super()
    if (
      isImageBitmap(data) ||
      data instanceof ImageData ||
      data instanceof HTMLCanvasElement ||
      data instanceof OffscreenCanvas
    ) {
      this.data = data
    } else if ('data' in data && 'width' in data && 'height' in data) {
      const input = data as ImageData
      this.data = new ImageData(input.data, input.width, input.height)
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


export class ArrayBufferSource extends TextureSource<ArrayBufferView> {
  public get isReady() {
    return true
  }
  public readonly width: number
  public readonly height: number
  public readonly data: ArrayBufferView

  public hasChanged = true

  public constructor(data: number[] | ArrayBuffer | ArrayBufferView, width: number, height: number, type: DataTypeOption) {
    super()
    this.width = width
    this.height = height

    if (ArrayBuffer.isView(data)) {
      this.data = data
    } else if (data instanceof ArrayBuffer || Array.isArray(data)) {
      this.data = new ArrayType[type](data)
    } else {
      throw new Error(`invalid argument 'data'. must be one of [number[] | ArrayBuffer | ArrayBufferView]`)
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
  type?: DataTypeOption
}

export function createTextureSource(source: TextureSourceInput, options?: CreateTextureSourceOptions): TextureSource {
  if (!source) {
    return null
  }

  if (typeof source === 'string') {
    return textureSourceFromUrl(source, options)
  }

  if (Array.isArray(source) && typeof source[0] === 'object') {
    this.setVideoUrls(source as any)
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
    if (!options.type) {
      throw new Error(`Invalid options for creating texture source. Type must be specified.`)
    }
    return new ArrayBufferSource(source, options.width, options.height, options.type)
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
