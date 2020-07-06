import { getOption } from '@gglib/utils'
import { StencilOperation } from '../../enums'

const lookup: { [k: number]: GPUStencilOperation } = {
  [StencilOperation.Zero]: 'zero',
  [StencilOperation.Keep]: 'keep',
  [StencilOperation.Replace]: 'replace',
  [StencilOperation.Increment]: 'increment-clamp',
  [StencilOperation.Decrement]: 'decrement-clamp',
  [StencilOperation.Invert]: 'invert',
  [StencilOperation.IncrementWrap]: 'increment-wrap',
  [StencilOperation.DecrementWrap]: 'decrement-wrap',
}

export function toStencilOperation(v: StencilOperation): GPUStencilOperation {
  return getOption(lookup, v, null)
}
