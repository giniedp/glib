import { BlendState, IBlendState } from '../../states/BlendState'
import { toBlendFactor, toBlendOperation } from '../utils'

export class BlendStateGPU extends BlendState {

  public constructor(public readonly gpuState: Partial<GPUColorStateDescriptor> = {}) {
    super()
    this.gpuState.colorBlend = this.gpuState.colorBlend || {}
    this.gpuState.alphaBlend = this.gpuState.alphaBlend || {}
  }

  public commitChanges(changes: Partial<IBlendState>) {
    if (changes.colorBlendFunction !== undefined) {
      this.gpuState.colorBlend.operation = toBlendOperation(changes.colorBlendFunction)
    }
    if (changes.colorSrcBlend !== undefined) {
      this.gpuState.colorBlend.srcFactor = toBlendFactor(changes.colorSrcBlend)
    }
    if (changes.colorDstBlend !== undefined) {
      this.gpuState.colorBlend.dstFactor = toBlendFactor(changes.colorDstBlend)
    }

    if (changes.alphaBlendFunction !== undefined) {
      this.gpuState.alphaBlend.operation = toBlendOperation(changes.alphaBlendFunction)
    }
    if (changes.alphaSrcBlend !== undefined) {
      this.gpuState.alphaBlend.srcFactor = toBlendFactor(changes.alphaSrcBlend)
    }
    if (changes.alphaDstBlend !== undefined) {
      this.gpuState.alphaBlend.dstFactor = toBlendFactor(changes.alphaDstBlend)
    }

    // TODO:
    // changes.constantR
    // changes.constantG
    // changes.constantB
    // changes.constantA
  }
}
