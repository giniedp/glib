import { FrontFace } from '../../enums'

const lookup: Record<FrontFace, GPUFrontFace> = {
  CW: 'cw',
  CCW: 'ccw',
}

export function toFrontFace(v: FrontFace): GPUFrontFace {
  return lookup[v] ?? null
}
