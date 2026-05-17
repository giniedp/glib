import { IVec3, Mat4, Vec2, Vec3, Vec4 } from '@gglib/math'
import type { GeometryBuilder } from '../GeometryBuilder'
import { trianglesToLines } from './indices'

/**
 * Cubic Bezier basis matrix.
 * @public
 */
export const BezierBasisMatrix: Mat4 =
  // prettier-ignore
  Mat4.create(
    1,  0,  0, 0,
  -3,  3,  0, 0,
    3, -6,  3, 0,
  -1,  3, -3, 1,
  )

export interface BuildBezierSurfaceOptions {
  /**
   * 16 control points as a flat array of xyz triples (48 values total),
   * in row-major order forming a 4×4 grid.
   */
  controlPoints: number[]

  /**
   * Number of subdivisions per side.
   * @default 16
   */
  segments?: number

  /**
   * Basis matrix for the surface. Defaults to cubic Bezier.
   */
  basis?: Mat4

  /**
   * Offset applied to all vertices.
   */
  offset?: IVec3

  /**
   * Inverts winding order and normals.
   * @default false
   */
  invert?: boolean

  /**
   * When `true`, builds a wireframe line mesh instead of a solid surface.
   * @default false
   */
  lines?: boolean
}

export const BuildBezierSurfaceDefaults = {
  segments: 16,
  invert: false,
  lines: false,
  basis: BezierBasisMatrix,
}

/**
 * Builds a bezier surface into the {@link GeometryBuilder}.
 *
 * Control points are a flat array of 48 values (16 xyz triples) in
 * row-major order forming a 4×4 grid.
 *
 * @public
 */
export function buildBezierSurface(builder: GeometryBuilder, options: BuildBezierSurfaceOptions) {
  const controlPoints = options.controlPoints
  const segments = options?.segments ?? BuildBezierSurfaceDefaults.segments
  const basis = options?.basis ?? BuildBezierSurfaceDefaults.basis
  const ox = options?.offset?.x ?? 0
  const oy = options?.offset?.y ?? 0
  const oz = options?.offset?.z ?? 0
  const invert = options?.invert ?? BuildBezierSurfaceDefaults.invert
  const lines = options?.lines ?? BuildBezierSurfaceDefaults.lines

  if (controlPoints.length !== 16 * 3) {
    throw new Error(
      `buildBezierSurface: controlPoints must have 48 values (16 xyz triples), got ${controlPoints.length}`,
    )
  }

  const stride = segments + 1
  const baseVertex = builder.vertexCount

  // build vertices
  for (let i = 0; i <= segments; i++) {
    const ti = i / segments
    const si = Vec4.create(1, ti, ti * ti, ti * ti * ti)

    const p1 = Vec3.create(
      Vec4.createFromArray(controlPoints, 0, 3).transformByMat4(basis).dot(si),
      Vec4.createFromArray(controlPoints, 1, 3).transformByMat4(basis).dot(si),
      Vec4.createFromArray(controlPoints, 2, 3).transformByMat4(basis).dot(si),
    )
    const p2 = Vec3.create(
      Vec4.createFromArray(controlPoints, 12, 3).transformByMat4(basis).dot(si),
      Vec4.createFromArray(controlPoints, 13, 3).transformByMat4(basis).dot(si),
      Vec4.createFromArray(controlPoints, 14, 3).transformByMat4(basis).dot(si),
    )
    const p3 = Vec3.create(
      Vec4.createFromArray(controlPoints, 24, 3).transformByMat4(basis).dot(si),
      Vec4.createFromArray(controlPoints, 25, 3).transformByMat4(basis).dot(si),
      Vec4.createFromArray(controlPoints, 26, 3).transformByMat4(basis).dot(si),
    )
    const p4 = Vec3.create(
      Vec4.createFromArray(controlPoints, 36, 3).transformByMat4(basis).dot(si),
      Vec4.createFromArray(controlPoints, 37, 3).transformByMat4(basis).dot(si),
      Vec4.createFromArray(controlPoints, 38, 3).transformByMat4(basis).dot(si),
    )

    for (let j = 0; j <= segments; j++) {
      const tj = j / segments
      const sj = Vec4.create(1, tj, tj * tj, tj * tj * tj)

      const p = Vec3.create(
        Vec4.create(p1.x, p2.x, p3.x, p4.x).transformByMat4(basis).dot(sj),
        Vec4.create(p1.y, p2.y, p3.y, p4.y).transformByMat4(basis).dot(sj),
        Vec4.create(p1.z, p2.z, p3.z, p4.z).transformByMat4(basis).dot(sj),
      )

      builder.addVertex({
        position: Vec3.createFrom({ x: p.x + ox, y: p.y + oy, z: p.z + oz }),
        normal: Vec3.createFrom({ x: 0, y: 1, z: 0 }), // TODO: compute from surface tangents
        texture: Vec2.createFrom({ x: i / segments, y: j / segments }),
      })
    }
  }

  // build indices
  const triangleIndices: number[] = []
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < segments; j++) {
      const a = baseVertex + i * stride + j
      const b = a + stride
      const c = b + 1
      const d = a + 1

      if (invert) {
        triangleIndices.push(a, c, b)
        triangleIndices.push(a, d, c)
      } else {
        triangleIndices.push(a, b, c)
        triangleIndices.push(a, c, d)
      }
    }
  }

  if (lines) {
    for (const i of trianglesToLines(triangleIndices)) {
      builder.addIndex(i)
    }
  } else {
    for (const i of triangleIndices) {
      builder.addIndex(i)
    }
  }
}
