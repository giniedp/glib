import { BoundingBox } from '../BoundingBox'
import { Mat4, mat4ApplyToVec3 } from '../Mat4'
import { vec3, vec3$init, vec3$initFrom, vec3Copy, vec3Max, vec3Min } from '../Vec3'

export function transformBox(box: BoundingBox, transform: Mat4, out: BoundingBox): void {
  const min = box.min
  const max = box.max

  const outMin = vec3.$0
  const outMax = vec3.$1
  const corner = vec3.$2

  vec3$init(corner, min.x, max.y, max.z)
  mat4ApplyToVec3(transform, corner, corner)
  vec3$initFrom(outMin, corner)
  vec3$initFrom(outMax, corner)
  vec3$init(corner, max.x, max.y, max.z)
  mat4ApplyToVec3(transform, corner, corner)
  vec3Min(min, corner, outMin)
  vec3Max(max, corner, outMax)
  vec3$init(corner, min.x, min.y, max.z)
  mat4ApplyToVec3(transform, corner, corner)
  vec3Min(min, corner, outMin)
  vec3Max(max, corner, outMax)
  vec3$init(corner, max.x, min.y, max.z)
  mat4ApplyToVec3(transform, corner, corner)
  vec3Min(min, corner, outMin)
  vec3Max(max, corner, outMax)
  vec3$init(corner, min.x, max.y, min.z)
  mat4ApplyToVec3(transform, corner, corner)
  vec3Min(min, corner, outMin)
  vec3Max(max, corner, outMax)
  vec3$init(corner, max.x, max.y, min.z)
  mat4ApplyToVec3(transform, corner, corner)
  vec3Min(min, corner, outMin)
  vec3Max(max, corner, outMax)
  vec3$init(corner, min.x, min.y, min.z)
  mat4ApplyToVec3(transform, corner, corner)
  vec3Min(min, corner, outMin)
  vec3Max(max, corner, outMax)
  vec3$init(corner, max.x, min.y, min.z)
  mat4ApplyToVec3(transform, corner, corner)
  vec3Min(min, corner, outMin)
  vec3Max(max, corner, outMax)

  vec3Copy(outMin, out.min)
  vec3Copy(outMax, out.max)
}
