import { Vec2, Vec3 } from '@glib/math'
import { ModelBuilder } from '../ModelBuilder'
import { formulas } from './formulas'

function withDefault(opt: any, value: any) {
  return opt == null ? value : opt
}

export function buildPlane(builder: ModelBuilder, options: {
  size?: number,
  steps?: number,
} = {}) {
  let size = withDefault(options.size, 2)
  let vertices = withDefault(options.steps, 1) + 1
  let vInv = 1.0 / vertices

  let baseVertex = builder.vertexCount
  let pos = Vec3.createZero()
  let uv = Vec2.createZero()

  for (let z = 0; z <= vertices; z += 1) {
    for (let x = 0; x <= vertices; x += 1) {
      builder.addVertex({
        position: pos.init(x * vInv - 0.5, 0, z * vInv - 0.5).multiplyScalar(size),
        texture: uv.init(x * vInv, z * vInv),
      })
    }
  }

  for (let z = 0; z < vertices; z += 1) {
    for (let x = 0; x < vertices; x += 1) {
      let a = x + z * (vertices + 1)
      let b = a + 1
      let c = x + (z + 1) * (vertices + 1)
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

formulas['Plane'] = buildPlane
