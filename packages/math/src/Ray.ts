import { BoundingBox } from './BoundingBox'
import { BoundingSphere } from './BoundingSphere'
import {
  rayBoxIntersects,
  rayBoxIntersectsAt,
  rayPlaneIntersects,
  rayPlaneIntersectsAt,
  raySphereIntersects,
  raySphereIntersectsAt,
  rayTriangleIntersects,
  rayTriangleIntersectsAt,
} from './Collision'
import type { IVec3, IVec4 } from './Types'
import { vec3, vec3Equals } from './Vec3'

export interface IRay {
  position: IVec3
  direction: IVec3
}

export function rayCreate(pos?: IVec3, dir?: IVec3): IRay {
  return { position: vec3(pos), direction: vec3(dir) }
}

export function ray$init(r: IRay, pos: IVec3, dir: IVec3): IRay {
  r.position.x = pos.x
  r.position.y = pos.y
  r.position.z = pos.z
  r.direction.x = dir.x
  r.direction.y = dir.y
  r.direction.z = dir.z
  return r
}

export function ray$initFrom(out: IRay, other: IRay): IRay {
  out.position.x = other.position.x
  out.position.y = other.position.y
  out.position.z = other.position.z
  out.direction.x = other.direction.x
  out.direction.y = other.direction.y
  out.direction.z = other.direction.z
  return out
}

export function rayCopy(r: IRay, out?: IRay) {
  out ||= { position: vec3(), direction: vec3() }
  ray$initFrom(out, r)
  return out
}

export function rayEquals(a: IRay, b: IRay) {
  return vec3Equals(a.position, b.position) && vec3Equals(a.direction, b.direction)
}

export function rayPositionAt(ray: IRay, distance: number, out?: IVec3) {
  out = out || vec3()
  out.x = ray.direction.x * distance + ray.position.x
  out.y = ray.direction.y * distance + ray.position.y
  out.z = ray.direction.z * distance + ray.position.z
  return out
}

export function rayIntersectsSphere(ray: IRay, sphere: BoundingSphere): boolean {
  return raySphereIntersects(ray.position, ray.direction, sphere.center, sphere.radius)
}
export function rayIntersectsBox(ray: IRay, box: BoundingBox): boolean {
  return rayBoxIntersects(ray.position, ray.direction, box.min, box.max)
}
export function rayIntersectsPlane(ray: IRay, plane: IVec4): boolean {
  return rayPlaneIntersects(ray.position, ray.direction, plane)
}
export function rayIntersectsTriangle(ray: IRay, a: IVec3, b: IVec3, c: IVec3): boolean {
  return rayTriangleIntersects(ray.position, ray.direction, a, b, c)
}

export function rayIntersectsSphereAt(ray: IRay, sphere: BoundingSphere): number {
  return raySphereIntersectsAt(ray.position, ray.direction, sphere.center, sphere.radius)
}
export function rayIntersectsBoxAt(ray: IRay, box: BoundingBox): number {
  return rayBoxIntersectsAt(ray.position, ray.direction, box.min, box.max)
}
export function rayIntersectsPlaneAt(ray: IRay, plane: IVec4): number {
  return rayPlaneIntersectsAt(ray.position, ray.direction, plane)
}
export function rayIntersectsTriangleAt(ray: IRay, a: IVec3, b: IVec3, c: IVec3): number {
  return rayTriangleIntersectsAt(ray.position, ray.direction, a, b, c)
}
