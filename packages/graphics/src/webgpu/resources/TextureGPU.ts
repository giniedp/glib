import {
  ArrayType,
  pixelFormatElementCount,
  TextureType,
} from '../../enums'

import { Texture, TextureDataOption, TextureOptions } from '../../resources/Texture'
import { DeviceGPU } from '../DeviceGPU'
import { toTextureFormat } from '../utils/textureFormat'

function isPowerOfTwo(value: number): boolean {
  return ((value > 0) && !(value & (value - 1))) // tslint:disable-line
}

/**
 * Describes a texture object.
 *
 * @public
 */
export class TextureGPU extends Texture {

  public readonly handle: GPUTexture

  private get dimensionGPU() {
    switch (this.type) {
      case TextureType.Texture:
        return '1d'
      case TextureType.Texture2D:
        return '2d'
      default:
        return '2d'
    }
  }

  /**
   * Constructs an instance of a Texture.
   *
   * @remarks
   * The options are passed down to {@link Texture.setup}
   */
  constructor(public readonly device: DeviceGPU, options: TextureOptions = {}) {
    super()
    this.setup(options)
  }

  public create(): this {
    if (this.handle == null) {
      this.set('handle', this.device.device.createTexture({
        dimension: this.dimensionGPU,
        format: toTextureFormat(this.pixelFormat, this.pixelType, true, false),
        mipLevelCount: this.generateMipmap ? Math.floor(Math.log(Math.max(this.width, this.height)) * Math.LOG2E) + 1 : 1,
        sampleCount: 4, // TODO:
        size: {
          width: this.width,
          height: this.height,
          depth: 1,
        },
        // tslint:disable-next-line: no-bitwise
        usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.SAMPLED | GPUTextureUsage.OUTPUT_ATTACHMENT,
      }))
    }
    return this
  }

  /**
   * Releases all resources and notifies the device that the texture is being destroyed.
   */
  public destroy(): this {
    this.set('image', null)
    this.set('video', null)
    this.set('handle', null)
    return this
  }

  /**
   * Binds the texture to the gl context.
   *
   * @returns the previously bound texture handle
   */
  public bind(): this {
    // TODO:
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

    if (this.width !== width || this.height !== height) {
      this.destroy()
    }
    this.set('width', width)
    this.set('height', height)
    this.set('isPOT', isPowerOfTwo(width) && isPowerOfTwo(height))
    this.create()

    // TODO:

    this.set('ready', true)
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

    if (this.width !== image.naturalWidth || this.height !== image.naturalHeight) {
      this.destroy()
    }
    this.set('width', image.naturalWidth)
    this.set('height', image.naturalHeight)
    this.set('isPOT', isPowerOfTwo(this.width) && isPowerOfTwo(this.height))
    this.create()
    // TODO:

    this.set('ready', true)
  }

  private updateFromVideo(video: HTMLVideoElement) {
    if (!video || video.readyState < 3 || video.currentTime === this.videoTime) {
      return
    }

    if (this.width !== video.width || this.height !== video.height) {
      this.destroy()
    }
    this.set('width', video.videoWidth)
    this.set('height', video.videoHeight)
    this.set('isPOT', isPowerOfTwo(this.width) && isPowerOfTwo(this.height))
    this.create()
    // TODO:

    this.set('ready', video.readyState >= 3)
    this.videoTime = video.currentTime
  }
}
