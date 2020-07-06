import { CullState, ICullState } from '../../states/CullState'
import { toCullMode, toFrontFace } from '../utils'

export class CullStateGPU extends CullState {

  public constructor(public readonly gpuState: GPURasterizationStateDescriptor = {}) {
    super()
  }

  public commitChanges(changes: Partial<ICullState>) {
    if (changes.cullMode !== undefined) {
      this.gpuState.cullMode = toCullMode(changes.cullMode)
    }
    if (changes.frontFace !== undefined) {
      this.gpuState.frontFace = toFrontFace(changes.frontFace)
    }
  }
}
