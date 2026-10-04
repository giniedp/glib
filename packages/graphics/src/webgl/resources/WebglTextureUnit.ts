import { Texture, TextureView } from '../../resources'
import { SamplerState } from '../../states'
import type { WebglDevice } from '../WebglDevice'
import { type WebglTexture } from '../resources/WebglTexture'

const DEFAULT_MAX_LEVEL = 32

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
  private baseLevel: number = 0
  private maxLevel: number = DEFAULT_MAX_LEVEL

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
    texture ||= this.device.defaultTexture
    sampler ||= SamplerState.Default

    let glBaseLevel = 0
    let glMaxLevel = DEFAULT_MAX_LEVEL
    if (texture instanceof Texture) {
      glBaseLevel = texture.residentMipLevel
      glMaxLevel = texture.mipLevelCount
    } else if (texture instanceof TextureView) {
      if (!texture.isFullRange) {
        glBaseLevel = texture.baseMipLevel
        glMaxLevel = texture.baseMipLevel + texture.mipLevelCount - 1
      } else {
        glBaseLevel = texture.texture.residentMipLevel
        glMaxLevel = texture.texture.mipLevelCount
      }
      texture = texture.texture
    }

    const resource = texture as WebglTexture
    const glType = resource.glType
    const glTexture = resource.glHandle
    const glSampler = this.device.getSampler(sampler).glHandle

    if (
      this.type !== glType ||
      this.texture !== glTexture ||
      this.sampler !== glSampler ||
      this.resource !== resource ||
      this.baseLevel !== glBaseLevel ||
      this.maxLevel !== glMaxLevel
    ) {
      this.type = glType
      this.texture = glTexture
      this.sampler = glSampler
      this.resource = resource
      this.baseLevel = glBaseLevel
      this.maxLevel = glMaxLevel
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
        gl.texParameteri(this.type, gl.TEXTURE_BASE_LEVEL, this.baseLevel)
        gl.texParameteri(this.type, gl.TEXTURE_MAX_LEVEL, this.maxLevel)
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
