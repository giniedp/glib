import { IVec3, Vec2, Vec3 } from '@gglib/math'
import type { GeometryBuilder } from '../model/GeometryBuilder'

/**
 * Options for the {@link buildParametricSurface} function
 *
 * @public
 */
export interface BuildParametricSurfaceOptions {
  /**
   * Function returning xyz position for u v input
   */
  position: (u: number, v: number) => IVec3
  /**
   * Function returning normal vector for u v input
   */
  normal?: (u: number, v: number) => IVec3
  /**
   * Start value of `u`. Default is `0`
   */
  uStart?: number
  /**
   * End value of `u`. Default is `1`
   */
  uEnd?: number
  /**
   * Start value of `v`. Default is `0`
   */
  vStart?: number
  /**
   * End value of `v`. Default is `1`
   */
  vEnd?: number
  /**
   * Steps in `u` direction, results in `uSteps + 1` vertices. Default is `1`
   */
  uSteps?: number
  /**
   * Steps in `v` direction, results in `vSteps + 1` vertices. Default is `1`
   */
  vSteps?: number
}

/**
 * Builds a parametric surface into the {@link GeometryBuilder}
 * @public
 */
export function buildParametricSurface(builder: GeometryBuilder, options: BuildParametricSurfaceOptions) {
  const position = options.position ?? ((u: number, v: number) => ({ x: 0, y: 0, z: 0 }))
  const normal = options.normal ?? null
  const uSteps = options.uSteps ?? 1
  const vSteps = options.vSteps ?? 1
  const u0 = options.uStart ?? 0
  const u1 = options.uEnd ?? 1
  const v0 = options.vStart ?? 0
  const v1 = options.vEnd ?? 1

  // build indices
  const indices = []
  for (let y = 0; y < vSteps; y++) {
    for (let x = 0; x < uSteps; x++) {
      let a = x + y * (uSteps + 1)
      let b = a + 1
      let c = x + (y + 1) * (uSteps + 1)
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
    position: Vec3
    normal: Vec3
    texture: Vec2
    tangent: Vec3
    bitangent: Vec3
  }> = []

  // calculate surface
  for (let y = 0; y <= vSteps; y++) {
    const t = y / vSteps
    const v = v0 + (v1 - v0) * t
    for (let x = 0; x <= uSteps; x++) {
      const s = x / uSteps
      const u = u0 + (u1 - u0) * s

      vertices.push({
        position: Vec3.convert(position(u, v)),
        normal: normal ? Vec3.convert(normal(u, v)) : Vec3.createZero(),
        texture: Vec2.create(s, t),
        tangent: Vec3.createZero(),
        bitangent: Vec3.createZero(),
      })
    }
  }

  // calculate normals
  const nrm = Vec3.createZero()
  const edge0 = Vec3.createZero()
  const edge1 = Vec3.createZero()
  const uv0 = Vec3.createZero()
  const uv1 = Vec3.createZero()
  for (let i = 0; i < indices.length - 2; i += 3) {
    const i0 = indices[i + 0]
    const i1 = indices[i + 1]
    const i2 = indices[i + 2]

    const p0 = vertices[i0].position
    const p1 = vertices[i1].position
    const p2 = vertices[i2].position

    Vec3.subtract(p1, p0, edge0)
    Vec3.subtract(p2, p0, edge1)

    if (!normal) {
      // calculate normal only if normal function is not given
      Vec3.cross(edge0, edge1, nrm)

      vertices[i0].normal.add(nrm)
      vertices[i1].normal.add(nrm)
      vertices[i2].normal.add(nrm)
    }

    const t0 = vertices[i0].texture
    const t1 = vertices[i1].texture
    const t2 = vertices[i2].texture

    Vec2.subtract(t1, t0, uv0)
    Vec2.subtract(t2, t0, uv1)
    const r = 1.0 / (uv0.x * uv1.y - uv0.y * uv1.x)

    nrm.init(
      (edge0.x * uv1.y - edge1.x * uv0.y) * r,
      (edge0.y * uv1.y - edge1.y * uv0.y) * r,
      (edge0.z * uv1.y - edge1.z * uv0.y) * r,
    )
    vertices[i0].tangent.add(nrm)
    vertices[i1].tangent.add(nrm)
    vertices[i2].tangent.add(nrm)
  }

  // add indices
  const baseVertex = builder.vertexCount
  for (const index of indices) {
    builder.addIndex(baseVertex + index)
  }
  // add surface vertices
  for (const vertex of vertices) {
    vertex.normal.normalize()
    vertex.tangent.normalize()
    Vec3.cross(vertex.tangent, vertex.normal, vertex.bitangent)
    vertex.bitangent.normalize()
    builder.addVertex(vertex)
  }
}
