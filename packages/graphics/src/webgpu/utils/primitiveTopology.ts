import { PrimitiveType } from '../../enums'

const lookup: Record<PrimitiveType, GPUPrimitiveTopology> = {
  PointList: 'point-list',
  LineList: 'line-list',
  LineStrip: 'line-strip',
  TriangleList: 'triangle-list',
  TriangleStrip: 'triangle-strip',
}

export function toPrimitiveTopology(v: PrimitiveType): GPUPrimitiveTopology {
  return lookup[v] ?? null
}
