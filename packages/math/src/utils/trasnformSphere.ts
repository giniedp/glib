import { BoundingSphere } from '../BoundingSphere'
import { Mat4 } from '../Mat4'
import { Vec3 } from '../Vec3'

export function transformSphere(sphere: BoundingSphere, transform: Mat4, out: BoundingSphere) {
  transform.transformV3(sphere.center, out.center)
  out.radius = transform.transformV3Normal(Vec3.$0.init(sphere.radius, sphere.radius, sphere.radius)).length()
}
