import {
  ArrayType,
  pixelFormatElementCount,
} from '../../enums'

import { Device } from '../../Device'

import { Texture, TextureDataOption, TextureOptions } from '../../resources/Texture'

function isPowerOfTwo(value: number): boolean {
  return ((value > 0) && !(value & (value - 1))) // tslint:disable-line
}

/**
 * Describes a texture object.
 *
 * @public
 */
export class TextureGL extends Texture {

  public readonly handle: WebGLTexture

  /**
   * Constructs an instance of a Texture.
   *
   * @remarks
   * The options are passed down to {@link Texture.setup}
   */
  constructor(public readonly device: Device<WebGLRenderingContext>, options: TextureOptions = {}) {
    super()
    this.setup(options)
  }

  public create(): this {
    if (!this.device.context.isTexture(this.handle)) {
      this.set('handle', this.device.context.createTexture())
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
    this.set('image', null)
    this.set('video', null)
    if (this.handle != null && this.device.context.isTexture(this.handle)) {
      this.device.context.deleteTexture(this.handle)
    }
    this.set('handle', null)
    return this
  }

  /**
   * Binds the texture to the gl context.
   *
   * @returns the previously bound texture handle
   */
  public bind(): this {
    this.device.context.bindTexture(this.type, this.handle)
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
    this.set('image', null)
    this.set('video', null)

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

    this.bind()
    this.device.context.texImage2D(this.type, 0, this.pixelFormat, width, height, 0, this.pixelFormat, this.pixelType, buffer)
    if (this.generateMipmap) {
      this.device.context.generateMipmap(this.type)
    }

    this.set('width', width)
    this.set('height', height)
    this.set('ready', true)
    this.set('isPOT', isPowerOfTwo(width) && isPowerOfTwo(height))
    return this
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
      this.updateFromImage(this.image)
    }
    if (this.video) {
      this.updateFromVideo(this.video)
    }
    return this
  }

  private updateFromImage(image: HTMLImageElement) {
    if (this.ready || !image || !image.complete) {
      return
    }

    const gl = this.device.context
    gl.bindTexture(this.type, this.handle)
    gl.texImage2D(this.type, 0, this.pixelFormat, this.pixelFormat, this.pixelType, image)
    if (this.generateMipmap) {
      gl.generateMipmap(this.type)
    }
    gl.bindTexture(this.type, null)

    this.set('ready', true)
    this.set('width', image.naturalWidth)
    this.set('height', image.naturalHeight)
    this.set('isPOT', isPowerOfTwo(this.width) && isPowerOfTwo(this.height))
  }

  private updateFromVideo(video: HTMLVideoElement) {
    if (!video || video.readyState < 3 || video.currentTime === this.videoTime) {
      return
    }

    const gl = this.device.context
    gl.bindTexture(this.type, this.handle)
    gl.texImage2D(this.type, 0, this.pixelFormat, this.pixelFormat, this.pixelType, video)
    if (this.generateMipmap && this.isPOT) {
      gl.generateMipmap(this.type)
    }
    gl.bindTexture(this.type, null)

    this.set('ready', video.readyState >= 3)
    this.set('width', video.videoWidth)
    this.set('height', video.videoHeight)
    this.set('isPOT', isPowerOfTwo(this.width) && isPowerOfTwo(this.height))
    this.videoTime = video.currentTime
  }
}
