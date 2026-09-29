import { BoundingCapsule } from '../BoundingCapsule'
import { Mat4 } from '../Mat4'
import { vec3, vec3$applyMat4Rotation, vec3$init, vec3ApplyMat4, vec3Length } from '../Vec3'

export function transformCapsule(capsule: BoundingCapsule, transform: Mat4, out: BoundingCapsule) {
  vec3ApplyMat4(capsule.start, transform, out.start)
  vec3ApplyMat4(capsule.end, transform, out.end)
  vec3$init(vec3.$0, out.radius, out.radius, out.radius)
  vec3$applyMat4Rotation(vec3.$0, transform)
  out.radius = vec3Length(vec3.$0)
}
