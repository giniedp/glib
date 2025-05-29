import {
  TextureType,
} from '../../enums'
import { SamplerState, SamplerStateParams } from '../../states'
import { DeviceGPU } from '../DeviceGPU'

/**
 * @public
 */
export class SamplerStateGPU extends SamplerState {

  /**
   * The graphics device
   */
  public readonly device: DeviceGPU

  constructor(device: DeviceGPU, options?: SamplerStateParams) {
    super()
    this.device = device
    this.create()
  }

  /**
   * Recreates the underlying sampler object if necessary
   */
  public create() {
    // TODO:
    return this
  }

  public dispose() {
    // TODO:
    return this
  }

  public commitChanges(changes?: SamplerStateParams): this {
    // TODO:
    return this
  }
}
