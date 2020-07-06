import { getOption } from '@gglib/utils'
import { FrontFace } from '../../enums'

const lookup: { [k: number]: GPUFrontFace } = {
  [FrontFace.ClockWise]: 'cw',
  [FrontFace.CounterClockWise]: 'ccw',
}

export function toFrontFace(v: FrontFace): GPUFrontFace {
  return getOption(lookup, v, null)
}
