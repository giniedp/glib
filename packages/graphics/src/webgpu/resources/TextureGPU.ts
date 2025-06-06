import { ArrayType, pixelFormatElementCount, TextureType } from '../../enums'
import { TextureDataOption, TextureImage, TextureImageOptions, TextureSourceOption } from '../../resources/TextureImage'

import { DeviceGPU } from '../DeviceGPU'
import { toTextureFormat } from '../utils/textureFormat'

function isPowerOfTwo(value: number): boolean {
  return value > 0 && !(value & (value - 1)) // tslint:disable-line
}

/**
 * Describes a texture object.
 *
 * @public
 */
export class TextureGPU extends TextureImage {
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
   * The options are passed down to {@link TextureImage.setup}
   */
  constructor(public readonly device: DeviceGPU, options: TextureImageOptions = {}) {
    super()
    this.setup(options)
  }

  public createResource() {
    if (this.handle == null) {
      this.set(
        'handle',
        this.device.device.createTexture({
          dimension: this.dimensionGPU,
          format: toTextureFormat(this.pixelFormat, this.pixelType, true, false),
          mipLevelCount: this.generateMipmap
            ? Math.floor(Math.log(Math.max(this.width, this.height)) * Math.LOG2E) + 1
            : 1,
          sampleCount: 4, // TODO:
          size: {
            width: this.width,
            height: this.height,
            depth: 1,
          },

          usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.SAMPLED | GPUTextureUsage.OUTPUT_ATTACHMENT,
        }),
      )
    }
  }

  protected disposeResource() {

  }

  /**
   * Releases all resources and notifies the device that the texture is being destroyed.
   */
  public dispose(): this {
    this.set('source', null)
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
    this.set('source', null)

    let buffer: ArrayBufferView
    if (data instanceof Array || data instanceof ArrayBuffer) {
      buffer = new ArrayType[this.pixelType](data)
    } else if (data && (data as ArrayBufferView).buffer instanceof ArrayBuffer) {
      if (data instanceof Uint8ClampedArray) {
        buffer = new Uint8Array(data.buffer)
      } else {
        buffer = data as ArrayBufferView
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
      this.dispose()
    }
    this.set('width', width)
    this.set('height', height)
    this.set('isPOT', isPowerOfTwo(width) && isPowerOfTwo(height))
    // this.create()

    // TODO:

    this.set('ready', true)
    return this
  }

  public setFaces(faces: TextureSourceOption[]) {
    // TODO:
    return this
  }

  public updateMipmaps(): this {
    // TODO:
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
   * the texture data. When data has arrived the {@link TextureImage.ready}
   * property will be set to `true`
   */
  public update(): boolean {
    if (!this.source || !this.source.update()) {
      return false
    }

    if (this.width !== this.source.width || this.height !== this.source.height) {
      this.dispose()
    }
    this.set('width', this.source.width)
    this.set('height', this.source.height)
    this.set('isPOT', isPowerOfTwo(this.width) && isPowerOfTwo(this.height))
    // this.create()

    // TODO:
    return true
  }
}
