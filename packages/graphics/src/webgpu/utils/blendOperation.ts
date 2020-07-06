import { getOption } from '@gglib/utils'
import { BlendFunction } from '../../enums'

const lookup: { [k: number]: GPUBlendOperation } = {
  [BlendFunction.Add]: 'add',
  [BlendFunction.Subtract]: 'subtract',
  [BlendFunction.ReverseSubtract]: 'reverse-subtract',
}

export function toBlendOperation(v: BlendFunction): GPUBlendOperation {
  return getOption(lookup, v, null)
}
