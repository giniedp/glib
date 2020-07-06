import { Device } from '../Device'

import { Texture } from '../resources'
import { SamplerState, SamplerStateParams } from './SamplerState'

/**
 * @public
 */
export abstract class TextureUnitState {

  /**
   * The graphics device
   */
  public abstract readonly device: Device
  /**
   * The sampler state object
   */
  public abstract readonly sampler: SamplerState
  /**
   * Gets the 0-based texture unit index
   */
  public abstract readonly index: number

  /**
   * Gets and sets the currently assigned texture
   *
   * @remarks
   * If the texture provides its own {@link Texture.samplerParams}
   * then the {@link TextureUnitState.sampler} of this unit is ignored.
   *
   * Changing this value does not bind the texture instantly.
   * {@link TextureUnitState.commit} must be called to actually bind the texture.
   */
  public texture: Texture

  /**
   * Activates this texture unit
   */
  public abstract activate(): this

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
  public abstract commit(samplerParams?: SamplerStateParams): this
}
