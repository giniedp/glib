import { IVec2, IVec3, Vec2, Vec3 } from '@gglib/math'
import { Color } from '../../Color'
import { PrimitiveType } from '../../enums'
import type { GeometryBuilder } from '../GeometryBuilder'

export function resolveLines(options?: { lines?: boolean; primitiveType?: PrimitiveType }) {
  const lines = !!options?.lines
  if (options && !options.primitiveType) {
    options = { ...options }
    options.primitiveType = lines ? 'LineList' : 'TriangleList'
  }

  if (lines && options?.primitiveType !== 'LineList') {
    console.warn(`'lines' option is true but primitiveType is '${options?.primitiveType}'`)
  }

  if (!lines && options?.primitiveType === 'LineList') {
    console.warn(`primitiveType is 'LineList' but 'lines' option is false`)
  }

  return options
}

/**
 * Options for the {@link buildParametricSurface} function
 *
 * @public
 *
 * @remarks
 * Callbacks receive both the remapped parameters (`u`, `v`) scaled to the
 * configured `uStart`/`uEnd` and `vStart`/`vEnd` ranges, and the normalized
 * parameters (`s`, `t`) in the `[0, 1]` range, which are useful for texture
 * coordinates and interpolation.
 */
export interface BuildParametricSurfaceOptions {
  /**
   * Returns the xyz position for the given surface parameters.
   *
   * @param u - Remapped U parameter (`uStart` to `uEnd`)
   * @param v - Remapped V parameter (`vStart` to `vEnd`)
   * @param s - Normalized U parameter (`0` to `1`)
   * @param t - Normalized V parameter (`0` to `1`)
   */
  position: (u: number, v: number, s: number, t: number) => IVec3
  /**
   * Returns the surface normal for the given surface parameters.
   * When omitted, normals are computed from the triangle geometry.
   *
   * @param u - Remapped U parameter (`uStart` to `uEnd`)
   * @param v - Remapped V parameter (`vStart` to `vEnd`)
   * @param s - Normalized U parameter (`0` to `1`)
   * @param t - Normalized V parameter (`0` to `1`)
   */
  normal?: (u: number, v: number, s: number, t: number) => IVec3
  /**
   * Returns a packed color value for the given surface parameters.
   *
   * @param u - Remapped U parameter (`uStart` to `uEnd`)
   * @param v - Remapped V parameter (`vStart` to `vEnd`)
   * @param s - Normalized U parameter (`0` to `1`)
   * @param t - Normalized V parameter (`0` to `1`)
   * @returns Color packed as RGBA (0xRRGGBBAA)
   */
  color?: (u: number, v: number, s: number, t: number) => number
  /**
   * Returns the texture coordinates for the given surface parameters.
   * When omitted, defaults to `(s, t)`.
   *
   * @param u - Remapped U parameter (`uStart` to `uEnd`)
   * @param v - Remapped V parameter (`vStart` to `vEnd`)
   * @param s - Normalized U parameter (`0` to `1`)
   * @param t - Normalized V parameter (`0` to `1`)
   */
  texture?: (u: number, v: number, s: number, t: number) => IVec2
  /**
   * Start value of `u`.
   * @default 0
   */
  uStart?: number
  /**
   * End value of `u`.
   * @default 1
   */
  uEnd?: number
  /**
   * Start value of `v`.
   * @default 0
   */
  vStart?: number
  /**
   * End value of `v`.
   * @default 1
   */
  vEnd?: number
  /**
   * Subdivisions in the U direction, resulting in `uSegments + 1` vertices.
   * @default 1
   */
  uSegments?: number
  /**
   * Subdivisions in the V direction, resulting in `vSegments + 1` vertices.
   * @default 1
   */
  vSegments?: number
  /**
   * If true, the triangle winding order is inverted, flipping face normals.
   * Useful for inside-facing surfaces or when composing multi-face meshes.
   * @default false
   */
  invert?: boolean
}

/**
 * Builds a parametric surface into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildParametricSurface(builder: GeometryBuilder, options: BuildParametricSurfaceOptions) {
  const position = options.position
  const normal = options.normal ?? null
  const texture = options.texture ?? null
  const uSegments = options.uSegments ?? 1
  const vSegments = options.vSegments ?? 1
  const u0 = options.uStart ?? 0
  const u1 = options.uEnd ?? 1
  const v0 = options.vStart ?? 0
  const v1 = options.vEnd ?? 1
  const invert = options.invert ?? false

  // build indices
  const indices = []
  for (let y = 0; y < vSegments; y++) {
    for (let x = 0; x < uSegments; x++) {
      let a = x + y * (uSegments + 1)
      let b = a + 1
      let c = x + (y + 1) * (uSegments + 1)
      let d = c + 1

      if (invert) {
        indices.push(a)
        indices.push(b)
        indices.push(c)

        indices.push(b)
        indices.push(d)
        indices.push(c)
      } else {
        indices.push(a)
        indices.push(c)
        indices.push(b)

        indices.push(b)
        indices.push(c)
        indices.push(d)
      }
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
  for (let y = 0; y <= vSegments; y++) {
    const t = y / vSegments
    const v = v0 + (v1 - v0) * t
    for (let x = 0; x <= uSegments; x++) {
      const s = x / uSegments
      const u = u0 + (u1 - u0) * s

      vertices.push({
        position: Vec3.convert(position(u, v, s, t)),
        normal: normal ? Vec3.convert(normal(u, v, s, t)) : Vec3.createZero(),
        texture: texture ? Vec2.convert(texture(s, t, s, t)) : Vec2.create(s, t),
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

/**
 * Builds a parametric line shape into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildParametricLines(builder: GeometryBuilder, options: BuildParametricSurfaceOptions) {
  const position = options.position ?? ((u: number, v: number) => ({ x: 0, y: 0, z: 0 }))
  const normal = options.normal ?? null
  const color = options.color ?? null
  const texture = options.texture ?? null
  const uSteps = options.uSegments ?? 1
  const vSteps = options.vSegments ?? 1
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
      indices.push(b)

      indices.push(a)
      indices.push(c)

      if (x === uSteps - 1) {
        indices.push(b)
        indices.push(d)
      }

      if (y === vSteps - 1) {
        indices.push(c)
        indices.push(d)
      }
    }
  }

  const vertices: Array<{
    position: Vec3
    normal: Vec3
    color: number
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
        position: Vec3.convert(position(u, v, s, t)),
        normal: normal ? Vec3.convert(normal(u, v, s, t)) : Vec3.createZero(),
        color: color ? color(u, v, s, t) : Color.packToRGBA(Color.White),
        texture: texture ? Vec2.convert(texture(s, t, s, t)) : Vec2.create(s, t),
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
