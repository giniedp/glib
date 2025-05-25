import { SamplerState, SamplerStateParams, TextureUnitState } from '../../states'
import { DeviceGL } from '../DeviceGL'
import { TextureGL } from '../resources'
import { SamplerStateGL } from './SamplerStateGL'

const TextureUnitMap = [
  0x84c0, 0x84c1, 0x84c2, 0x84c3, 0x84c4, 0x84c5, 0x84c6, 0x84c7, 0x84c8, 0x84c9, 0x84ca, 0x84cb, 0x84cc, 0x84cd,
  0x84ce, 0x84cf, 0x84d0, 0x84d1, 0x84d2, 0x84d3, 0x84d4, 0x84d5, 0x84d6, 0x84d7, 0x84d8, 0x84d9, 0x84da, 0x84db,
  0x84dc, 0x84dd, 0x84de, 0x84df,
]

/**
 * @public
 */
export class TextureUnitStateGL extends TextureUnitState {
  /**
   * Gets the id of a texture unit by its index
   */
  public static textureUnitId(textureUnitIndex: number) {
    return TextureUnitMap[textureUnitIndex]
  }

  /**
   * Gets the texture unit id
   */
  public get unit(): number {
    return TextureUnitMap[this.index]
  }

  /**
   * The graphics device
   */
  public readonly device: DeviceGL
  /**
   * The sampler state object
   */
  public readonly sampler: SamplerStateGL
  /**
   * Gets the 0-based texture unit index
   */
  public readonly index: number

  constructor(device: DeviceGL, index: number) {
    super()
    this.device = device
    this.index = index
    this.sampler = device.createSamplerState()
  }

  /**
   * Activates this texture unit
   */
  public activate(): this {
    this.device.context.activeTexture(this.unit)
    return this
  }

  /**
   * Assigns and commits the sampler state and current texture to this texture unit
   *
   * @remarks
   * The given sampler state will be ignored if the current texture provides
   * own sampler state.
   *
   * If current texture is not power of two the sampler state params will be
   * automatically adjusted so webgl engine does not raise errors.
   *
   * @param samplerParams - The sampler state to assign
   */
  public commit(samplerParams?: SamplerStateParams): this {
    let sampler: SamplerStateGL = this.sampler
    let texture: TextureGL = this.texture as TextureGL

    if (!texture) {
      //
    } else if (texture.samplerParams) {
      // override any sampler params
      samplerParams = texture.samplerParams
      // and re-use its own sampler in this case
      sampler = texture.sampler as SamplerStateGL
    } else if (this.device.isWebGL2) {
      //
    } else {
      // and re-use its own sampler in this case
      sampler = texture.sampler as SamplerStateGL
    }

    if (samplerParams) {
      sampler.assign(samplerParams)
    }
    if (texture && !texture.isPOT) {
      SamplerState.fixNonPowerOfTwo(sampler)
    }
    sampler.commit()

    const gl = this.device.context as WebGL2RenderingContext
    gl.activeTexture(this.unit)

    if (texture) {
      gl.bindTexture(texture.type, texture.resource)
    } else {
      gl.bindTexture(texture.type, null)
    }
    if (this.device.isWebGL2) {
      gl.bindSampler(this.index, sampler.samplerHandle)
    }

    return this
  }
}
