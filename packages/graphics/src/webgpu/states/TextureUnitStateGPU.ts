import { SamplerStateParams, TextureUnitState } from '../../states'
import { DeviceGPU } from '../DeviceGPU'
import { SamplerStateGPU } from './SamplerStateGPU'

/**
 * @public
 */
export class TextureUnitStateGPU extends TextureUnitState {

  /**
   * The graphics device
   */
  public readonly device: DeviceGPU
  /**
   * The sampler state object
   */
  public readonly sampler: SamplerStateGPU
  /**
   * Gets the 0-based texture unit index
   */
  public readonly index: number

  constructor(device: DeviceGPU, index: number) {
    super()
    this.device = device
    this.index = index
    this.sampler = device.createSamplerState()
  }

  /**
   * Activates this texture unit
   */
  public activate(): this {
    // TODO:
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
    // TODO:
    return this
  }
}
