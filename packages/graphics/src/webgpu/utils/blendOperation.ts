import { BlendFunction } from '../../enums'

const lookup: Record<BlendFunction, GPUBlendOperation> = {
  Add: 'add',
  Subtract: 'subtract',
  ReverseSubtract: 'reverse-subtract',
  Min: 'min',
  Max: 'max',
}

export function toBlendOperation(v: BlendFunction): GPUBlendOperation {
  return lookup[v] ?? null
}
