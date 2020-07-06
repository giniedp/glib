import { IStencilState, StencilState } from '../../states/StencilState'
import { toCompareFunction, toStencilOperation } from '../utils'

export class StencilStateGPU extends StencilState {

  public constructor(public readonly gpuState: Partial<GPUDepthStencilStateDescriptor> = {}) {
    super()
    this.gpuState.stencilFront = this.gpuState.stencilFront || {}
    this.gpuState.stencilBack = this.gpuState.stencilBack || {}
  }

  public commitChanges(changes: Partial<IStencilState>) {
    if (changes.stencilFunction !== undefined) {
      this.gpuState.stencilFront.compare = toCompareFunction(changes.stencilFunction)
    }
    if (changes.stencilDepthFail !== undefined) {
      this.gpuState.stencilFront.depthFailOp = toStencilOperation(changes.stencilDepthFail)
    }
    if (changes.stencilFail !== undefined) {
      this.gpuState.stencilFront.failOp = toStencilOperation(changes.stencilFail)
    }
    // this.stencilFront.passOp = TODO:

    if (changes.stencilBackFunction !== undefined) {
      this.gpuState.stencilBack.compare = toCompareFunction(changes.stencilBackFunction)
    }
    if (changes.stencilBackDepthFail !== undefined) {
      this.gpuState.stencilBack.depthFailOp = toStencilOperation(changes.stencilBackDepthFail)
    }
    if (changes.stencilBackFail !== undefined) {
      this.gpuState.stencilBack.failOp = toStencilOperation(changes.stencilBackFail)
    }
    // this.stencilBack.passOp = TODO:

  }
}
