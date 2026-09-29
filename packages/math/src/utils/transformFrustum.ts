import { BoundingFrustum } from '../BoundingFrustum'
import { Mat4, mat4Premultiply } from '../Mat4'

export function transformFrustum(frustum: BoundingFrustum, transform: Mat4, out: BoundingFrustum) {
  mat4Premultiply(frustum.matrix, transform, out.matrix)
  out.update()
}
