import { Vec2, Vec3 } from '@glib/math'
import { ModelBuilder } from '../ModelBuilder'
import { buildCone } from './buildCone'

function withDefault(opt: any, value: any) {
  return opt == null ? value : opt
}

export function buildCylinder(builder: ModelBuilder, options: {
  height?: number
  diameter?: number
  radius?: number
  steps?: number,
} = {}) {
  let radius = withDefault(options.radius, withDefault(options.diameter, 1) * 0.5)
  buildCone(builder, {
    height: options.height,
    steps: options.steps,
    topRadius: radius,
    bottomRadius: radius,
  })
}

ModelBuilder.formulas['Cylinder'] = buildCylinder
