import { Device } from './../Device'
import { Texture } from './../Texture'
import { SamplerState, SamplerStateParams } from './SamplerState'
import { TextureType } from '../enums';

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
export class TextureUnitState {
  /**
   * Gets the id of a texture unit by its index
   */
  public static textureUnitId(textureUnitIndex: number) {
    return TextureUnitMap[textureUnitIndex]
  }

  /**
   * Gets the 0-based texture unit index
   */
  public get index(): number {
    return this.$index
  }

  /**
   * Gets the texture unit id
   */
  public get unit(): number {
    return TextureUnitMap[this.$index]
  }

  /**
   * Gets and sets the currently assigned texture
   *
   * @remarks
   * If the texture provides its own {@link Texture.samplerParams}
   * then the {@link samplerState} of this unit is ignored.
   *
   * Changing this value does not bind the texture instantly.
   * {@link commit} must be called to actually bind the texture.
   */
  public texture: Texture

  public readonly sampler: SamplerState

  /**
   * The graphics device
   */
  public readonly device: Device

  private $index: number
  private $type: TextureType

  constructor(device: Device, index: number) {
    this.device = device
    this.$index = index
    this.sampler = new SamplerState(device)
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

    let sampler = this.sampler
    let texture = this.texture

    if (!texture) {
      //
    } else if (texture.samplerParams) {
      // override any sampler params
      samplerParams = texture.samplerParams
      // and re-use its own sampler in this case
      sampler = texture.sampler
    } else if (this.device.isWebGL2) {
      //
    } else {
      // and re-use its own sampler in this case
      sampler = texture.sampler
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
      this.$type = texture.type
    } else {
      gl.bindTexture(texture.type, null)
    }
    if (this.device.isWebGL2) {
      gl.bindSampler(this.$index, sampler.samplerHandle)
    }

    return this
  }
}
