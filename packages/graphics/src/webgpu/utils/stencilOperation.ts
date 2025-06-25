import { StencilOperation } from '../../enums'

const lookup: Record<StencilOperation, GPUStencilOperation> = {
  Zero: 'zero',
  Keep: 'keep',
  Replace: 'replace',
  IncrementClamp: 'increment-clamp',
  DecrementClamp: 'decrement-clamp',
  Invert: 'invert',
  IncrementWrap: 'increment-wrap',
  DecrementWrap: 'decrement-wrap',
}

export function toStencilOperation(v: StencilOperation): GPUStencilOperation {
  return lookup[v] ?? null
}
