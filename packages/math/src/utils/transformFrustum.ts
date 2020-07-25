import { BoundingFrustum } from '../BoundingFrustum'
import { Mat4 } from '../Mat4'

export function transformFrustum(frustum: BoundingFrustum, transform: Mat4, out: BoundingFrustum) {
  Mat4.premultiply(frustum.matrix, transform, out.matrix)
  out.update()
}
