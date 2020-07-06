import { getOption } from '@gglib/utils'
import { CompareFunction } from '../../enums'

const lookup: { [k: number]: GPUCompareFunction } = {
  [CompareFunction.Never]: 'never',
  [CompareFunction.Less]: 'less',
  [CompareFunction.Equal]: 'equal',
  [CompareFunction.LessEqual]: 'less-equal',
  [CompareFunction.Greater]: 'greater',
  [CompareFunction.NotEqual]: 'not-equal',
  [CompareFunction.GreaterEqual]: 'greater-equal',
  [CompareFunction.Always]: 'always',
}

export function toCompareFunction(v: CompareFunction): GPUCompareFunction {
  return getOption(lookup, v, null)
}
