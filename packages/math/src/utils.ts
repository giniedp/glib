import { BoundingBox } from './BoundingBox'
import { BoundingCapsule } from './BoundingCapsule'
import { BoundingFrustum } from './BoundingFrustum'
import { BoundingSphere } from './BoundingSphere'
import { Mat4 } from './Mat4'
import { Plane } from './Plane'
import { Vec3 } from './Vec3'

const temp1v3 = new Vec3()
const temp2v3 = new Vec3()
const temp3v3 = new Vec3()

export function transformBox(box: BoundingBox, transform: Mat4, out: BoundingBox): void {
  const min = box.min
  const max = box.max
  const outMin = temp1v3
  const outMax = temp2v3
  const corner = temp3v3

  transform.transformV3(corner.init(min.x, max.y, max.z))
  outMin.initFrom(corner)
  outMax.initFrom(corner)
  transform.transformV3(corner.init(max.x, max.y, max.z))
  Vec3.min(min, corner, outMin)
  Vec3.max(max, corner, outMax)
  transform.transformV3(corner.init(min.x, min.y, max.z))
  Vec3.min(min, corner, outMin)
  Vec3.max(max, corner, outMax)
  transform.transformV3(corner.init(max.x, min.y, max.z))
  Vec3.min(min, corner, outMin)
  Vec3.max(max, corner, outMax)
  transform.transformV3(corner.init(min.x, max.y, min.z))
  Vec3.min(min, corner, outMin)
  Vec3.max(max, corner, outMax)
  transform.transformV3(corner.init(max.x, max.y, min.z))
  Vec3.min(min, corner, outMin)
  Vec3.max(max, corner, outMax)
  transform.transformV3(corner.init(min.x, min.y, min.z))
  Vec3.min(min, corner, outMin)
  Vec3.max(max, corner, outMax)
  transform.transformV3(corner.init(max.x, min.y, min.z))
  Vec3.min(min, corner, outMin)
  Vec3.max(max, corner, outMax)

  Vec3.clone(outMin, out.min)
  Vec3.clone(outMax, out.max)
}

export function transformSphere(sphere: BoundingSphere, transform: Mat4, out: BoundingSphere) {
  transform.transformV3(sphere.center, out.center)
  out.radius = transform
    .transformV3Normal(temp1v3.init(sphere.radius, sphere.radius, sphere.radius))
    .length()
}

export function transformPlane(plane: Plane, transform: Mat4, out: Plane) {
  transform.transformV3Normal(plane, out)
  out.w = transform.transformV3(temp1v3.init(-plane.w, -plane.w, -plane.w)).length()
}

export function transformCapsule(capsule: BoundingCapsule, transform: Mat4, out: BoundingCapsule) {
  transform.transformV3(capsule.start, out.start)
  transform.transformV3(capsule.end, out.end)
  out.radius = transform
    .transformV3Normal(temp1v3.init(out.radius, out.radius, out.radius))
    .length()
}

export function transformFrustum(frustum: BoundingFrustum, transform: Mat4, out: BoundingFrustum) {
  Mat4.premultiply(frustum.matrix, transform, out.matrix)
  out.update()
}
