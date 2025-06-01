import { Vec2, Vec3 } from '@gglib/math'
import { Device } from '../../Device'
import type { Geometry } from '../Geometry'
import { beginGeometry, GeometryBuilder } from '../GeometryBuilder'

function circleVector(t: number, out: Vec3) {
  out = out || new Vec3()
  let angle = t * Math.PI * 2
  let dx = Math.cos(angle)
  let dz = Math.sin(angle)
  return out.init(dx, 0, dz)
}

export const BuildCapDefaults = {
  diameter: 1,
  radius: 0.5,
  steps: 16,
}

export interface BuildCapOptions {
  diameter?: number
  radius?: number
  steps?: number
}

export function capGeometry(device: Device, options?: BuildCapOptions): Geometry {
  return beginGeometry().append(buildCap, options).endGeometry(device, {
    name: 'cap',
  })
}

/**
 * Builds a cap shape into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildCap(builder: GeometryBuilder, options?: BuildCapOptions) {
  const diameter = options?.diameter ?? BuildCapDefaults.diameter
  const radius = options?.radius ?? diameter * 0.5
  const steps = options?.steps ?? BuildCapDefaults.steps
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
