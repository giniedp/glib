import { FrontFace } from '../../enums'

const lookup: { [k: number]: GPUFrontFace } = {
  [FrontFace.ClockWise]: 'cw',
  [FrontFace.CounterClockWise]: 'ccw',
}

export function toFrontFace(v: FrontFace): GPUFrontFace {
  return lookup[v] ?? null
}
