import { CompareFunction } from '../../enums'

const lookup: Record<CompareFunction, GPUCompareFunction> = {
  Never: 'never',
  Less: 'less',
  Equal: 'equal',
  LessEqual: 'less-equal',
  Greater: 'greater',
  NotEqual: 'not-equal',
  GreaterEqual: 'greater-equal',
  Always: 'always',
}

export function toCompareFunction(v: CompareFunction): GPUCompareFunction {
  return lookup[v] ?? null
}
