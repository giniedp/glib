function isPowerOfTwo(value: number): boolean {
  return ((value > 0) && !(value & (value - 1))) // tslint:disable-line
}

export abstract class TextureSource<T extends TexImageSource = TexImageSource> {
  abstract readonly isReady: boolean
  abstract readonly width: number
  abstract readonly height: number
  abstract readonly data: T
  readonly isPowerOfTwo: boolean

  abstract update(): boolean

  protected updatePowerOfTwo() {
    if (this.isReady) {
      (this as { isPowerOfTwo: boolean }).isPowerOfTwo = isPowerOfTwo(this.width) && isPowerOfTwo(this.height)
    }
  }
}

export class TextureSourceImage extends TextureSource<HTMLImageElement> {
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
    this.data.addEventListener('load', () => this.hasChanged = true)
  }

  public hasChanged = false
  public update(): boolean {
    if (this.isPowerOfTwo == null && this.isReady) {
      this.updatePowerOfTwo()
      return true
    }
    if (this.hasChanged) {
      this.hasChanged = false
      return true
    }
    return false
  }
}

export class TextureSourceVideo extends TextureSource<HTMLVideoElement> {
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
    let changed = this.data.currentTime !== this.videoTime
    if (this.isPowerOfTwo == null) {
      this.updatePowerOfTwo()
      changed = true
    }
    return changed
  }
}

export class TextureSourceData extends TextureSource<ImageBitmap | ImageData | HTMLCanvasElement | OffscreenCanvas> {
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

  public constructor(data: ImageBitmap | ImageData | HTMLCanvasElement | OffscreenCanvas) {
    super()
    this.data = data
  }

  public hasChanged = false

  public update(): boolean {
    if (this.isPowerOfTwo == null && this.isReady) {
      this.updatePowerOfTwo()
      return true
    }
    if (this.hasChanged) {
      this.hasChanged = false
      return true
    }
    return false
  }
}
