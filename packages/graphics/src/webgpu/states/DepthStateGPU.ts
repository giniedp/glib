import { DepthState, IDepthState } from '../../states/DepthState'
import { toCompareFunction } from '../utils'

export class DepthStateGPU extends DepthState {

  public constructor(public readonly gpuState: Partial<GPUDepthStencilStateDescriptor> = {}) {
    super()
  }

  public commitChanges(_: Partial<IDepthState>) {
    if (this.enable) {
      this.gpuState.depthCompare = toCompareFunction(this.depthFunction)
      this.gpuState.depthWriteEnabled = this.depthWriteEnable
    } else {
      this.gpuState.depthCompare = null
      this.gpuState.depthWriteEnabled = null
    }
  }
}
