import { Mat4, Vec3, Vec4 } from '@gglib/math'
import type { ModelBuilder } from '../model/ModelBuilder'

const baseMatrix: Mat4 = Mat4.create(
  1, 0, 0, 0,
  -3, 3, 0, 0,
  3, -6, 3, 0,
  -1, 3, -3, 1,
)

/**
 * Builds a bezier surface into the {@link ModelBuilder}
 * @public
 */
export function buildBezierSurface(builder: ModelBuilder, patch: number[], tesselation: number, basis: Mat4 = baseMatrix) {
  if (patch.length !== 16 * 3) {
    throw new Error(`Bezier patch expected to have a total length of 48 but was ${patch.length}`)
  }

  const stride = tesselation + 1
  for (let i = 0; i < stride; i++) {
    const ti = i / tesselation
    for (let j = 0; j < stride; j++) {
      const tj = j / tesselation

      const a = i * stride + j
      const b = a + stride
      const c = b + 1
      const d = a + 1

      builder.addIndex(a)
      builder.addIndex(b)
      builder.addIndex(c)

      builder.addIndex(a)
      builder.addIndex(c)
      builder.addIndex(d)

      const si = Vec4.create(1, ti, ti * ti, ti * ti * ti)
      const p1 = Vec3.create(
        Vec4.createFromArray(patch, 0, 3).transformByMat4(basis).dot(si),
        Vec4.createFromArray(patch, 1, 3).transformByMat4(basis).dot(si),
        Vec4.createFromArray(patch, 2, 3).transformByMat4(basis).dot(si),
      )
      const p2 = Vec3.create(
        Vec4.createFromArray(patch, 12, 3).transformByMat4(basis).dot(si),
        Vec4.createFromArray(patch, 13, 3).transformByMat4(basis).dot(si),
        Vec4.createFromArray(patch, 14, 3).transformByMat4(basis).dot(si),
      )
      const p3 = Vec3.create(
        Vec4.createFromArray(patch, 24, 3).transformByMat4(basis).dot(si),
        Vec4.createFromArray(patch, 25, 3).transformByMat4(basis).dot(si),
        Vec4.createFromArray(patch, 26, 3).transformByMat4(basis).dot(si),
      )
      const p4 = Vec3.create(
        Vec4.createFromArray(patch, 36, 3).transformByMat4(basis).dot(si),
        Vec4.createFromArray(patch, 37, 3).transformByMat4(basis).dot(si),
        Vec4.createFromArray(patch, 38, 3).transformByMat4(basis).dot(si),
      )

      const sj = Vec4.create(1, tj, tj * tj, tj * tj * tj)
      const p = Vec3.create(
        Vec4.create(p1.x, p2.x, p3.x, p4.x).transformByMat4(basis).dot(sj),
        Vec4.create(p1.y, p2.y, p3.y, p4.y).transformByMat4(basis).dot(sj),
        Vec4.create(p1.z, p2.z, p3.z, p4.z).transformByMat4(basis).dot(sj),
      )

      builder.addVertex({
        position: p,
        normal: [0, 1, 0],
        texture: [i / stride, j / stride],
      })
    }
  }
}
