import { WebGpuDevice } from './WebGpuDevice'

export class WebGpuComputeEncoder {
  public readonly device: WebGpuDevice
  public constructor(device: WebGpuDevice) {
    this.device = device
  }
}
