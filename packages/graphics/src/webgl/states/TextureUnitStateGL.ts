import { SamplerState, SamplerStateParams, TextureUnitState } from '../../states'
import { DeviceGL } from '../DeviceGL'
import { TextureGL } from '../resources'
import { SamplerStateGL } from './SamplerStateGL'

const TextureUnitMap = [
  0x84C0, 0x84C1, 0x84C2, 0x84C3,
  0x84C4, 0x84C5, 0x84C6, 0x84C7,
  0x84C8, 0x84C9, 0x84CA, 0x84CB,
  0x84CC, 0x84CD, 0x84CE, 0x84CF,
  0x84D0, 0x84D1, 0x84D2, 0x84D3,
  0x84D4, 0x84D5, 0x84D6, 0x84D7,
  0x84D8, 0x84D9, 0x84DA, 0x84DB,
  0x84DC, 0x84DD, 0x84DE, 0x84DF,
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
      gl.bindTexture(texture.type, texture.handle)
    } else {
      gl.bindTexture(texture.type, null)
    }
    if (this.device.isWebGL2) {
      gl.bindSampler(this.index, sampler.samplerHandle)
    }

    return this
  }
}
