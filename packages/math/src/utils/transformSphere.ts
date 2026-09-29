import { BoundingSphere } from '../BoundingSphere'
import { Mat4 } from '../Mat4'
import { vec3, vec3$applyMat3, vec3$applyMat4Rotation, vec3$initFill, vec3Length } from '../Vec3'

export function transformSphere(sphere: BoundingSphere, transform: Mat4, out: BoundingSphere) {
  vec3$applyMat3(sphere.center, transform)
  vec3$initFill(vec3.$0, sphere.radius)
  vec3$applyMat4Rotation(vec3.$0, transform)
  out.radius = vec3Length(vec3.$0)
}
