import { Device } from '../Device'

import { Texture, TextureImage } from '../resources'
import { SamplerState } from './SamplerState'

/**
 * @public
 */
export abstract class TextureUnitState {
  /**
   * The graphics device
   */
  public abstract readonly device: Device

  /**
   * The default sampler state
   */
  public abstract readonly sampler: SamplerState

  /**
   * Gets the 0-based texture unit index
   */
  public abstract readonly index: number

  /**
   * Assigns and commits the sampler state and current texture to this texture unit
   */
  public abstract commit(texture: TextureImage | Texture, sampler?: SamplerState): this
}
