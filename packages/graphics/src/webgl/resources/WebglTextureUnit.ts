import type { Texture } from '../../resources'
import { SamplerState } from '../../states'
import type { WebglDevice } from '../WebglDevice'
import type { WebglTexture } from '../resources/WebglTexture'

/**
 * @public
 */
export class WebglTextureUnit {
  public readonly index: number
  public readonly device: WebglDevice
  public readonly glUnit: number

  public changed: boolean = false
  private type: number
  private texture: WebGLTexture
  private sampler: WebGLSampler

  public constructor(device: WebglDevice, index: number) {
    this.device = device
    this.index = index
    this.glUnit = device.context.TEXTURE0 + index
    this.device.onContextLost.add(() => {
      this.type = undefined
      this.texture = null
      this.sampler = null
    })
  }

  /**
   * Sets the texture and sampler, but does not commit it to the GPU
   */
  public set(texture: Texture, sampler: SamplerState): void {
    texture ||= this.device.defaultTexture
    sampler ||= SamplerState.Default

    const glType = (texture as WebglTexture).glType
    const glTexture = (texture as WebglTexture).glHandle
    const glSampler = this.device.getSampler(sampler).glHandle
    if (this.texture !== glTexture || this.sampler !== glSampler || this.type !== glType) {
      this.type = glType
      this.texture = glTexture
      this.sampler = glSampler
      this.changed = true
    }
  }

  /**
   * Commits the texture and sampler to the GPU
   */
  public commit(force?: boolean): void {
    if (this.changed || force) {
      const gl = this.device.context
      gl.activeTexture(this.glUnit)
      gl.bindTexture(this.type, this.texture)
      gl.bindSampler(this.index, this.sampler)
      this.changed = false
    }
  }

  /**
   *
   * @param texture
   * @param sampler
   */
  public update(texture: Texture, sampler: SamplerState): void {
    this.set(texture, sampler)
    this.commit()
  }

  /**
   * Sets the texture and sampler and activates the unit for further operations, such as data upload.
   */
  public activate(texture: Texture, sampler: SamplerState): void {
    this.set(texture, sampler)
    if (this.changed) {
      this.commit()
    } else {
      this.device.context.activeTexture(this.glUnit)
    }
  }
}
