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

  constructor(device: DeviceGPU, texture?: { type: number, handle: WebGLTexture }) {
    super()
    this.device = device
    this.setup()
  }

  /**
   * Recreates the underlying sampler object if necessary
   */
  public setup() {
    // TODO:
    return this
  }

  public destroy() {
    // TODO:
    return this
  }

  public commitChanges(changes?: SamplerStateParams): this {
    // TODO:
    this.clearChanges()
    return this
  }
}
