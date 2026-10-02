import { TextureView, type Texture } from '../../resources'
import { SamplerState } from '../../states'
import type { WebglDevice } from '../WebglDevice'
import { GL_DEFAULT_BASE_LEVEL, GL_DEFAULT_MAX_LEVEL, type WebglTexture } from '../resources/WebglTexture'

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
  private resource: WebglTexture
  private baseLevel: number = GL_DEFAULT_BASE_LEVEL
  private maxLevel: number = GL_DEFAULT_MAX_LEVEL

  public constructor(device: WebglDevice, index: number) {
    this.device = device
    this.index = index
    this.glUnit = device.context.TEXTURE0 + index
    this.device.onContextLost.add(() => {
      this.type = undefined
      this.texture = null
      this.sampler = null
      this.resource = null
    })
  }

  /**
   * Sets the texture and sampler, but does not commit it to the GPU
   *
   * @remarks
   * A {@link TextureView} restricts the sampled mip levels by setting `TEXTURE_BASE_LEVEL` and `TEXTURE_MAX_LEVEL`
   * on the texture object. A plain texture restores the full range.
   */
  public set(texture: Texture | TextureView, sampler: SamplerState): void {
    let baseLevel = GL_DEFAULT_BASE_LEVEL
    let maxLevel = GL_DEFAULT_MAX_LEVEL
    if (texture instanceof TextureView) {
      if (!texture.isFullRange) {
        baseLevel = texture.baseMipLevel
        maxLevel = texture.baseMipLevel + texture.mipLevelCount - 1
      }
      texture = texture.texture
    }
    texture ||= this.device.defaultTexture
    sampler ||= SamplerState.Default

    const resource = texture as WebglTexture
    const glType = resource.glType
    const glTexture = resource.glHandle
    const glSampler = this.device.getSampler(sampler).glHandle
    if (
      this.texture !== glTexture ||
      this.sampler !== glSampler ||
      this.type !== glType ||
      // range state lives on the texture object and may have been changed through another unit
      resource.glBaseLevel !== baseLevel ||
      resource.glMaxLevel !== maxLevel
    ) {
      this.type = glType
      this.texture = glTexture
      this.sampler = glSampler
      this.resource = resource
      this.baseLevel = baseLevel
      this.maxLevel = maxLevel
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
      const resource = this.resource
      if (resource && !resource.isRenderBuffer) {
        if (resource.glBaseLevel !== this.baseLevel) {
          gl.texParameteri(this.type, gl.TEXTURE_BASE_LEVEL, this.baseLevel)
          resource.glBaseLevel = this.baseLevel
        }
        if (resource.glMaxLevel !== this.maxLevel) {
          gl.texParameteri(this.type, gl.TEXTURE_MAX_LEVEL, this.maxLevel)
          resource.glMaxLevel = this.maxLevel
        }
      }
      this.changed = false
    }
  }

  /**
   *
   * @param texture
   * @param sampler
   */
  public update(texture: Texture | TextureView, sampler: SamplerState): void {
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
