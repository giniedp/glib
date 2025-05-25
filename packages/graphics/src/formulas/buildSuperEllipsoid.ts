import { Vec2, Vec3 } from '@gglib/math'
import { Device } from '../Device'
import { Geometry } from '../model/Geometry'
import { beginGeometry, type GeometryBuilder } from '../model/GeometryBuilder'

export const BuildSuperEllipsoidDefaults = {
  diameter: 1,
  radius: 0.5,
  steps: 16,
  n1: 1,
  n2: 1,
}

export interface BuildSuperEllipsoidOptions {
  diameter?: number
  radius?: number
  steps?: number
  n1?: number
  n2?: number
}

export function superEllipsoidGeometry(device: Device, options?: BuildSuperEllipsoidOptions): Geometry {
  return beginGeometry().append(buildSuperEllipsoid, options).endGeometry(device, {
    name: 'super ellipsoid',
  })
}

/**
 * Builds a super ellipsoid shape into the {@link GeometryBuilder}
 *
 * @public
 * @remarks
 * implementation is based on {@link http://paulbourke.net/geometry/superellipse/}
 */
export function buildSuperEllipsoid(builder: GeometryBuilder, options?: BuildSuperEllipsoidOptions) {
  const diameter = options?.diameter ?? BuildSuperEllipsoidDefaults.diameter
  const radius = options?.radius ?? diameter * 0.5
  const steps = options?.steps ?? BuildSuperEllipsoidDefaults.steps
  const power1 = options?.n1 ?? BuildSuperEllipsoidDefaults.n1
  const power2 = options?.n2 ?? BuildSuperEllipsoidDefaults.n2

  const baseVertex = builder.vertexCount
  const stepsV = steps
  const stepsU = steps * 2

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

function sign(a: number) {
  return a < 0 ? -1 : 1
}
