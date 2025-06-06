import { Device } from '../Device'
import { SamplerState, SamplerStateParams } from '../states'
import { TextureImage, TextureImageOptions } from './TextureImage'

export interface TextureOptions extends TextureImageOptions {
  /**
   * User defined name
   */
  name?: string

  /**
   * User defined meta data and annotations
   */
  meta?: Record<string, any>

  /**
   * The sampler state to be used together with this texture
   */
  sampler?: SamplerStateParams
}

export class Texture {
  public readonly device: Device

  /**
   * The texture image
   */
  public image: TextureImage

  /**
   * The sampler state used to sample the image
   */
  public sampler?: SamplerState

  /**
   * User defined name
   */
  public name?: string

  /**
   * User defined meta data and annotations
   */
  public meta?: Record<string, any>

  public get width() {
    return this.image.width
  }

  public get height() {
    return this.image.height
  }

  public get depthFormat() {
    return this.image.depthFormat
  }

  public get ready() {
    return this.image.ready
  }

  public get is2D() {
    return this.image.is2D
  }

  public get isCube() {
    return this.image.isCube
  }

  public get isRenderTarget() {
    return this.image.isRenderTarget
  }

  public get activeFace() {
    return this.image.targetFace
  }

  public constructor(device: Device, options: TextureOptions) {
    this.device = device
    this.setup(options)
  }

  public setup(options: TextureOptions) {
    this.name = options.name ?? this.name
    this.meta = options.meta ?? this.meta

    // recreate the image. If it is reference counted and options did not change
    // this is a 'no-op' and the instance won't be recreated.
    const image = this.device.createTextureImage(options)
    this.image?.dispose()
    this.image = image

    if ('sampler' in options) {
      this.setupSampler(options.sampler)
    }
  }

  public setupSampler(sampler: SamplerStateParams | null) {
    if (!sampler) {
      // explicit null means to remove the sampler
      this.sampler?.dispose()
    } else {
      const newSampler = this.device.createSamplerState(sampler)
      this.sampler?.dispose()
      this.sampler = newSampler
    }
  }

  public dispose() {
    if (this.sampler) {
      this.sampler.dispose()
      this.sampler = null
    }
    if (this.image) {
      this.image.dispose()
      this.image = null
    }
  }

  public update() {
    return this.image?.update()
  }

  /**
   * Resize the texture image to the given width and height.
   */
  public resize(width: number, height: number) {
    this.image.resize(width, height)
  }
}
