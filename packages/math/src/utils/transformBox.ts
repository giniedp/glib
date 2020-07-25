import { BoundingBox } from '../BoundingBox'
import { Mat4 } from '../Mat4'
import { Vec3 } from '../Vec3'

export function transformBox(box: BoundingBox, transform: Mat4, out: BoundingBox): void {
  const min = box.min
  const max = box.max

  const outMin = Vec3.$0
  const outMax = Vec3.$1
  const corner = Vec3.$2

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
