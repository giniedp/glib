import { Vec2, Vec3 } from '@glib/math'
import { ModelBuilder } from '../ModelBuilder'

function withDefault(opt: any, value: any) {
  return opt == null ? value : opt
}

/**
 * http://paulbourke.net/geometry/mobius/
 * @param builder
 * @param options
 * @constructor
 */
export function buildMobiusStrip(builder: ModelBuilder, options: {
  diameter?: number
  radius?: number
  steps?: number
  band?: number,
} = {}) {
  let radius = withDefault(options.radius, withDefault(options.diameter, 1) * 0.5)
  let steps = withDefault(options.steps, 16)
  let band = withDefault(options.band, 0.4)

  let baseVertex = builder.vertexCount
  let stepsV = steps
  let stepsH = steps * 2

  for (let v = 0; v <= stepsV; v += 1) {
    let dv = v / stepsV * band
    let t = dv - band * 0.5

    for (let u = 0; u <= stepsH; u += 1) {
      let du = u / stepsH
      let phi = du * Math.PI * 2

      let sinPhi = Math.sin(phi)
      let cosPhi = Math.cos(phi)

      let x = cosPhi + t * Math.cos(phi / 2) * cosPhi
      let z = sinPhi + t * Math.cos(phi / 2) * sinPhi
      let y = t * Math.sin(phi / 2)

      let normal = Vec3.create(x, y, z)
      let texCoord = Vec2.create(du, dv)

      builder.addVertex({
        position: Vec3.multiplyScalar<Vec3>(normal, radius),
        normal: normal,
        texture: texCoord,
      })
    }
  }
  for (let z = 0; z < stepsV; z += 1) {
    for (let x = 0; x < stepsH; x += 1) {
      let a = x + z * (stepsH + 1)
      let b = a + 1
      let c = x + (z + 1) * (stepsH + 1)
      let d = c + 1

      builder.addIndex(baseVertex + a)
      builder.addIndex(baseVertex + b)
      builder.addIndex(baseVertex + c)

      builder.addIndex(baseVertex + c)
      builder.addIndex(baseVertex + b)
      builder.addIndex(baseVertex + d)
    }
  }
}

ModelBuilder.formulas['MobiusStrip'] = buildMobiusStrip
