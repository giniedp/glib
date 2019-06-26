import { Vec2, Vec3 } from '@gglib/math'
import { ModelBuilder } from '../ModelBuilder'
import { getOption } from '@gglib/utils';

function sign(a: number) {
  return a < 0 ? -1 : 1
}

/**
 * Builds a super ellipsoid shape into the {@link ModelBuilder}
 *
 * @public
 * @remarks
 * implementation is based on {@link http://paulbourke.net/geometry/superellipse/}
 */
export function buildSuperEllipsoid(builder: ModelBuilder, options: {
  diameter?: number
  radius?: number
  steps?: number
  n1?: number
  n2?: number,
} = {}) {
  let radius = getOption(options, 'radius', getOption(options, 'diameter', 1) * 0.5)
  let steps = getOption(options, 'steps', 16)
  let power1 = getOption(options, 'n1', 1)
  let power2 = getOption(options, 'n2', 1)

  let baseVertex = builder.vertexCount
  let stepsV = steps
  let stepsU = steps * 2

  for (let v = 0; v <= stepsV; v += 1) {
    let dv = v / stepsV
    let phi = dv * Math.PI - Math.PI / 2
    let sinPhi = Math.sin(phi)
    let cosPhi = Math.cos(phi)

    for (let u = 0; u <= stepsU; u += 1) {
      let du = u / stepsU
      let theta = du * Math.PI * 2 - Math.PI
      let sinTheta = Math.sin(theta)
      let cosTheta = Math.cos(theta)

      let tmp = sign(cosPhi) * Math.pow(Math.abs(cosPhi), power1)
      let x = tmp * sign(cosTheta) * Math.pow(Math.abs(cosTheta), power2)
      let z = tmp * sign(sinTheta) * Math.pow(Math.abs(sinTheta), power2)
      let y = sign(sinPhi) * Math.pow(Math.abs(sinPhi), power1)

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
      builder.addIndex(baseVertex + c)
      builder.addIndex(baseVertex + b)

      builder.addIndex(baseVertex + b)
      builder.addIndex(baseVertex + c)
      builder.addIndex(baseVertex + d)
    }
  }
}
