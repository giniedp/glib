import { Vec2, Vec3 } from '@glib/math'
import { ModelBuilder } from '../ModelBuilder'

function withDefault(opt: any, value: any) {
  return opt == null ? value : opt
}

/**
 * implementation is based on http://paulbourke.net/geometry/sphericalh/
 * @param builder
 * @param options
 * @constructor
 */
export function buildSphericalHarmonics(builder: ModelBuilder, options: {
  diameter?: number
  radius?: number
  steps?: number
  parameters?: number[],
} = {}) {
  let radius = withDefault(options.radius, withDefault(options.diameter, 1) * 0.5)
  let steps = withDefault(options.steps, 16)
  let params = withDefault(options.parameters, [])

  let baseVertex = builder.vertexCount
  let stepsV = steps
  let stepsU = steps * 2

  for (let v = 0; v <= stepsV; v += 1) {
    let dv = v / stepsV
    let phi = dv * Math.PI // - Math.PI / 2;

    for (let u = 0; u <= stepsU; u += 1) {
      let du = u / stepsU
      let theta = du * Math.PI * 2 // - Math.PI;

      let scale = 0
      scale += Math.pow(Math.sin((params[0] || 0) * phi), params[1] || 0)
      scale += Math.pow(Math.cos((params[2] || 0) * phi), params[3] || 0)
      scale += Math.pow(Math.sin((params[4] || 0) * theta), params[5] || 0)
      scale += Math.pow(Math.cos((params[6] || 0) * theta), params[7] || 0)
      scale *= 0.25

      let x = scale * Math.sin(phi) * Math.cos(theta)
      let y = scale * Math.sin(phi) * Math.sin(theta)
      let z = scale * Math.cos(phi)

      let normal = Vec3.create(x, y, z)
      let texCoord = Vec2.create(du, dv)

      builder.addVertex({
        position: Vec3.multiplyScalar(normal, radius),
        normal: normal.normalize(),
        texture: texCoord,
      })
    }
  }
  for (let z = 0; z < stepsV; z += 1) {
    for (let x = 0; x < stepsU; x += 1) {
      let a = x + z * (stepsU + 1)
      let b = a + 1
      let c = x + (z + 1) * (stepsU + 1)
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

ModelBuilder.formulas['SphericalHarmonics'] = buildSphericalHarmonics
