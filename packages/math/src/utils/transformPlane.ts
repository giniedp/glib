import { Plane } from '../Plane'
import { Mat4 } from '../Mat4'
import { Vec3 } from '../Vec3'

export function transformPlane(plane: Plane, transform: Mat4, out: Plane) {
  transform.transformV3Normal(plane, out)
  out.w = transform.transformV3(Vec3.$0.init(-plane.w, -plane.w, -plane.w)).length()
}
