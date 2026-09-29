import { Mat4 } from '../Mat4'
import type { IVec4 } from '../Types'
import { vec3, vec3$applyMat4, vec3$initFill, vec3ApplyMat4Rotation, vec3Length } from '../Vec3'

export function transformPlane(plane: IVec4, transform: Mat4, out: IVec4) {
  vec3ApplyMat4Rotation(plane, transform, out)
  vec3$initFill(vec3.$0, -plane.w)
  vec3$applyMat4(vec3.$0, transform)
  out.w = vec3Length(vec3.$0)
}
