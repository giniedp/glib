import { IVec3, Vec2, Vec3 } from '@gglib/math'
import { ModelBuilder } from '../ModelBuilder'

function withDefault(opt: any, value: any) {
  return opt == null ? value : opt
}

export interface AddParametricSurfaceOptions {
  /**
   * Function returning xyz position for u v input
   */
  f?: (u: number, v: number) => IVec3,
  /**
   * Start value of `u`. Default is `0`
   */
  u0?: number,
  /**
   * End value of `u`. Default is `1`
   */
  u1?: number,
  /**
   * Start value of `v`. Default is `0`
   */
  v0?: number,
  /**
   * End value of `v`. Default is `1`
   */
  v1?: number,
  /**
   * Tesselation in `u` direction. Must be greater than 0
   */
  tu?: number,
  /**
   * Tesselation in `v` direction. Must be greater than 0
   */
  tv?: number,
}

/**
 * @public
 */
export function addParametricSurface(builder: ModelBuilder, options: AddParametricSurfaceOptions = {}) {
  const f = withDefault(options.f, (u: number, v: number) => {
    return { x: 0, y: 0, z: 0 }
  })
  const tu = withDefault(options.tu, 1)
  const tv = withDefault(options.tv, 1)
  const u0 = withDefault(options.u0, 0)
  const u1 = withDefault(options.u1, 1)
  const v0 = withDefault(options.v0, 0)
  const v1 = withDefault(options.v1, 1)

  // build indices
  const indices = []
  for (let y = 0; y < tv; y++) {
    for (let x = 0; x < tu; x++) {
      let a = x + y * (tu + 1)
      let b = a + 1
      let c = x + (y + 1) * (tu + 1)
      let d = c + 1

      indices.push(a)
      indices.push(c)
      indices.push(b)

      indices.push(b)
      indices.push(c)
      indices.push(d)
    }
  }

  const vertices: Array<{
    position: Vec3,
    normal: Vec3,
    texture: Vec2,
  }> = []

  // calculate surface
  for (let y = 0; y <= tv; y++) {
    const t = y / tv
    const v = v0 + (v1 - v0) * t
    for (let x = 0; x <= tu; x++) {
      const s = x / tu
      const u = u0 + (u1 - u0) * s

      vertices.push({
        position: Vec3.convert(f(u, v)),
        normal: Vec3.createZero(),
        texture: Vec2.create(s, t),
      })
    }
  }

  // calculate normals
  const t0 = Vec3.createZero()
  const t1 = Vec3.createZero()
  const nrm = Vec3.createZero()
  for (let i = 0; i < indices.length - 2; i += 3) {
    const i0 = indices[i + 0]
    const i1 = indices[i + 1]
    const i2 = indices[i + 2]

    const p0 = vertices[i0].position
    const p1 = vertices[i1].position
    const p2 = vertices[i2].position

    Vec3.subtract(p2, p0, t0)
    Vec3.subtract(p1, p0, t1)
    Vec3.cross(t0, t1, nrm)

    vertices[i0].normal.add(nrm)
    vertices[i1].normal.add(nrm)
    vertices[i2].normal.add(nrm)
  }

  // add indices
  const baseVertex = builder.vertexCount
  for (const index of indices) {
    builder.addIndex(baseVertex + index)
  }
  // add surface vertices
  for (const vertex of vertices) {
    vertex.normal.normalize()
    builder.addVertex(vertex)
  }
}
