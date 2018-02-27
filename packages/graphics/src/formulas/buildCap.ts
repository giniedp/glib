import { Vec2, Vec3 } from '@glib/math'
import { ModelBuilder } from '../ModelBuilder'

function circleVector(t: number, out: Vec3) {
  out = out || new Vec3()
  let angle = t * Math.PI * 2
  let dx = Math.cos(angle)
  let dz = Math.sin(angle)
  return out.init(dx, 0, dz)
}

function withDefault(opt: any, value: any) {
  return opt == null ? value : opt
}

export function buildCap(builder: ModelBuilder, options: {
  diameter?: number,
  radius?: number,
  steps?: number,
} = {}) {
  let radius = withDefault(options.radius, withDefault(options.diameter, 1) * 0.5)
  let steps = withDefault(options.steps, 16)
  let baseVertex = builder.vertexCount
  let position = Vec3.createZero()
  let texture = Vec2.createZero()

  for (let step = 0; step <= steps; step += 1) {
    circleVector(step / steps, position)
    texture.init(position.x, position.z)
    position.multiplyScalar(radius)

    builder.addVertex({
      position: position,
      texture: texture,
    })
  }

  for (let step = 0; step < steps - 1; step += 1) {
    builder.addIndex(baseVertex)
    builder.addIndex(baseVertex + step + 2)
    builder.addIndex(baseVertex + step + 1)
  }
}

ModelBuilder.formulas['Cap'] = buildCap
