import { Vec2, Vec3 } from '@gglib/math'
import { getOption } from '@gglib/utils'
import type { ModelBuilder } from '../model/ModelBuilder'

function circleVector(t: number, out: Vec3) {
  out = out || new Vec3()
  let angle = t * Math.PI * 2
  let dx = Math.cos(angle)
  let dz = Math.sin(angle)
  return out.init(dx, 0, dz)
}

/**
 * Builds a cap shape into the {@link ModelBuilder}
 *
 * @public
 */
export function buildCap(builder: ModelBuilder, options: {
  diameter?: number,
  radius?: number,
  steps?: number,
} = {}) {
  const radius = getOption(options, 'radius', getOption(options, 'diameter', 1) * 0.5)
  const steps = getOption(options, 'steps', 16)
  const baseVertex = builder.vertexCount
  const position = Vec3.createZero()
  const texture = Vec2.createZero()

  for (let step = 0; step <= steps; step += 1) {
    circleVector(step / steps, position)
    texture.init(position.x, position.z)
    position.multiplyScalar(radius)

    builder.addVertex({
      position: position,
      texture: texture,
      normal: [0, 1, 0],
    })
  }

  for (let step = 0; step < steps - 1; step += 1) {
    builder.addIndex(baseVertex)
    builder.addIndex(baseVertex + step + 1)
    builder.addIndex(baseVertex + step + 2)
  }
}
