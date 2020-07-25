import { BoundingCapsule } from '../BoundingCapsule'
import { Mat4 } from '../Mat4'
import { Vec3 } from '../Vec3'

export function transformCapsule(capsule: BoundingCapsule, transform: Mat4, out: BoundingCapsule) {
  transform.transformV3(capsule.start, out.start)
  transform.transformV3(capsule.end, out.end)
  out.radius = transform.transformV3Normal(Vec3.$0.init(out.radius, out.radius, out.radius)).length()
}
