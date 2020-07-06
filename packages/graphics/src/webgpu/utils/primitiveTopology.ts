import { getOption } from '@gglib/utils'
import { PrimitiveType } from '../../enums'

const lookup: { [k: number]: GPUPrimitiveTopology } = {
  [PrimitiveType.PointList]: 'point-list',
  [PrimitiveType.LineList]: 'line-list',
  [PrimitiveType.LineStrip]: 'line-strip',
  [PrimitiveType.TriangleList]: 'triangle-list',
  [PrimitiveType.TriangleStrip]: 'triangle-strip',
  [PrimitiveType.TriangleFan]: null,
}

export function toPrimitiveTopology(v: PrimitiveType): GPUPrimitiveTopology {
  return getOption(lookup, v, null)
}
