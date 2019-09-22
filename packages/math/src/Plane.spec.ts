import { BoundingBox } from './BoundingBox'
import { BoundingCapsule } from './BoundingCapsule'
import { BoundingSphere } from './BoundingSphere'
import { PlaneIntersectionType } from './Collision'
import { Plane } from './Plane'
import { Vec3 } from './Vec3'

describe('Plane', () => {

  it('constructor', () => {
    expect(new Plane().x).toBe(0)
    expect(new Plane().y).toBe(0)
    expect(new Plane().z).toBe(0)
    expect(new Plane().w).toBe(0)

    expect(new Plane(1, 2, 3, 4).x).toBe(1)
    expect(new Plane(1, 2, 3, 4).y).toBe(2)
    expect(new Plane(1, 2, 3, 4).z).toBe(3)
    expect(new Plane(1, 2, 3, 4).w).toBe(4)
  })

  it('setter & getter', () => {
    expect(new Plane().setX(1).x).toBe(1)
    expect(new Plane().setY(1).y).toBe(1)
    expect(new Plane().setZ(1).z).toBe(1)
    expect(new Plane().setW(1).w).toBe(1)

    expect(new Plane().set('x', 1).x).toBe(1)
    expect(new Plane().set('y', 1).y).toBe(1)
    expect(new Plane().set('z', 1).z).toBe(1)
    expect(new Plane().set('w', 1).w).toBe(1)

    expect(new Plane(1, 2, 3, 4).get('x')).toBe(1)
    expect(new Plane(1, 2, 3, 4).get('y')).toBe(2)
    expect(new Plane(1, 2, 3, 4).get('z')).toBe(3)
    expect(new Plane(1, 2, 3, 4).get('w')).toBe(4)
  })

  it('init', () => {
    expect(new Plane().init(1, 2, 3, 4).x).toBe(1)
    expect(new Plane().init(1, 2, 3, 4).y).toBe(2)
    expect(new Plane().init(1, 2, 3, 4).z).toBe(3)
    expect(new Plane().init(1, 2, 3, 4).w).toBe(4)
  })

  it('create', () => {
    expect(Plane.create(1, 2, 3, 4)).toEqual(new Plane(1, 2, 3, 4))
    expect(Plane.create(1, 2, 3, 4)).toEqual(new Plane(1, 2, 3, 4))
    expect(Plane.create(1, 2, 3, 4)).toEqual(new Plane(1, 2, 3, 4))
    expect(Plane.create(1, 2, 3, 4)).toEqual(new Plane(1, 2, 3, 4))
  })

  it('getNormal', () => {
    expect(new Plane(1, 2, 3).getNormal()).toEqual(Vec3.create(1, 2, 3))
    expect(new Plane(1, 2, 3).getNormal({})).toEqual(Vec3.init({}, 1, 2, 3))
  })

  it('distanceToPoint', () => {
    expect(new Plane(1, 0, 0, -1).distanceToPoint(Vec3.init({}, -1, 0, 0))).toBe(-2)
    expect(new Plane(1, 0, 0, -1).distanceToPoint(Vec3.init({}, 0, 0, 0))).toBe(-1)
    expect(new Plane(1, 0, 0, -1).distanceToPoint(Vec3.init({}, 1, 0, 0))).toBe(0)
    expect(new Plane(1, 0, 0, -1).distanceToPoint(Vec3.init({}, 2, 0, 0))).toBe(1)

    expect(new Plane(0, 1, 0, -1).distanceToPoint(Vec3.init({}, 0, -1, 0))).toBe(-2)
    expect(new Plane(0, 1, 0, -1).distanceToPoint(Vec3.init({}, 0, 0, 0))).toBe(-1)
    expect(new Plane(0, 1, 0, -1).distanceToPoint(Vec3.init({}, 0, 1, 0))).toBe(0)
    expect(new Plane(0, 1, 0, -1).distanceToPoint(Vec3.init({}, 0, 2, 0))).toBe(1)

    expect(new Plane(0, 0, 1, -1).distanceToPoint(Vec3.init({}, 0, 0, -1))).toBe(-2)
    expect(new Plane(0, 0, 1, -1).distanceToPoint(Vec3.init({}, 0, 0, 0))).toBe(-1)
    expect(new Plane(0, 0, 1, -1).distanceToPoint(Vec3.init({}, 0, 0, 1))).toBe(0)
    expect(new Plane(0, 0, 1, -1).distanceToPoint(Vec3.init({}, 0, 0, 2))).toBe(1)
  })

  it('intersectsPoint', () => {
    for (let i = 0; i < 10; i++) {
      const r = 0
      const point = Vec3.createRandom()
      expect(Plane.create(-1, 0, 0, point.x - r - 0.1).intersectsPoint(point)).toBe(PlaneIntersectionType.Back)
      expect(Plane.create(-1, 0, 0, point.x - r).intersectsPoint(point)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(-1, 0, 0, point.x).intersectsPoint(point)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(-1, 0, 0, point.x + r).intersectsPoint(point)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(-1, 0, 0, point.x + r + 0.1).intersectsPoint(point)).toBe(PlaneIntersectionType.Front)

      expect(Plane.create(1, 0, 0, -point.x - r - 0.1).intersectsPoint(point)).toBe(PlaneIntersectionType.Back)
      expect(Plane.create(1, 0, 0, -point.x - r).intersectsPoint(point)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(1, 0, 0, -point.x).intersectsPoint(point)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(1, 0, 0, -point.x + r).intersectsPoint(point)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(1, 0, 0, -point.x + r + 0.1).intersectsPoint(point)).toBe(PlaneIntersectionType.Front)

      expect(Plane.create(0, -1, 0, point.y - r - 0.1).intersectsPoint(point)).toBe(PlaneIntersectionType.Back)
      expect(Plane.create(0, -1, 0, point.y - r).intersectsPoint(point)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, -1, 0, point.y).intersectsPoint(point)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, -1, 0, point.y + r).intersectsPoint(point)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, -1, 0, point.y + r + 0.1).intersectsPoint(point)).toBe(PlaneIntersectionType.Front)

      expect(Plane.create(0, 1, 0, -point.y - r - 0.1).intersectsPoint(point)).toBe(PlaneIntersectionType.Back)
      expect(Plane.create(0, 1, 0, -point.y - r).intersectsPoint(point)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, 1, 0, -point.y).intersectsPoint(point)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, 1, 0, -point.y + r).intersectsPoint(point)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, 1, 0, -point.y + r + 0.1).intersectsPoint(point)).toBe(PlaneIntersectionType.Front)

      expect(Plane.create(0, 0, -1, point.z - r - 0.1).intersectsPoint(point)).toBe(PlaneIntersectionType.Back)
      expect(Plane.create(0, 0, -1, point.z - r).intersectsPoint(point)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, 0, -1, point.z).intersectsPoint(point)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, 0, -1, point.z + r).intersectsPoint(point)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, 0, -1, point.z + r + 0.1).intersectsPoint(point)).toBe(PlaneIntersectionType.Front)

      expect(Plane.create(0, 0, 1, -point.z - r - 0.1).intersectsPoint(point)).toBe(PlaneIntersectionType.Back)
      expect(Plane.create(0, 0, 1, -point.z - r).intersectsPoint(point)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, 0, 1, -point.z).intersectsPoint(point)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, 0, 1, -point.z + r).intersectsPoint(point)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, 0, 1, -point.z + r + 0.1).intersectsPoint(point)).toBe(PlaneIntersectionType.Front)
    }
  })

  it('intersectsSphere', () => {
    for (let i = 0; i < 10; i++) {
      const r = Math.random()
      const sphere = BoundingSphere.create(Math.random(), Math.random(), Math.random(), r)
      expect(Plane.create(-1, 0, 0, sphere.center.x - r - 0.1).intersectsSphere(sphere)).toBe(PlaneIntersectionType.Back)
      expect(Plane.create(-1, 0, 0, sphere.center.x - r).intersectsSphere(sphere)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(-1, 0, 0, sphere.center.x).intersectsSphere(sphere)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(-1, 0, 0, sphere.center.x + r).intersectsSphere(sphere)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(-1, 0, 0, sphere.center.x + r + 0.1).intersectsSphere(sphere)).toBe(PlaneIntersectionType.Front)

      expect(Plane.create(1, 0, 0, -sphere.center.x - r - 0.1).intersectsSphere(sphere)).toBe(PlaneIntersectionType.Back)
      expect(Plane.create(1, 0, 0, -sphere.center.x - r).intersectsSphere(sphere)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(1, 0, 0, -sphere.center.x).intersectsSphere(sphere)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(1, 0, 0, -sphere.center.x + r).intersectsSphere(sphere)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(1, 0, 0, -sphere.center.x + r + 0.1).intersectsSphere(sphere)).toBe(PlaneIntersectionType.Front)

      expect(Plane.create(0, -1, 0, sphere.center.y - r - 0.1).intersectsSphere(sphere)).toBe(PlaneIntersectionType.Back)
      expect(Plane.create(0, -1, 0, sphere.center.y - r).intersectsSphere(sphere)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, -1, 0, sphere.center.y).intersectsSphere(sphere)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, -1, 0, sphere.center.y + r).intersectsSphere(sphere)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, -1, 0, sphere.center.y + r + 0.1).intersectsSphere(sphere)).toBe(PlaneIntersectionType.Front)

      expect(Plane.create(0, 1, 0, -sphere.center.y - r - 0.1).intersectsSphere(sphere)).toBe(PlaneIntersectionType.Back)
      expect(Plane.create(0, 1, 0, -sphere.center.y - r).intersectsSphere(sphere)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, 1, 0, -sphere.center.y).intersectsSphere(sphere)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, 1, 0, -sphere.center.y + r).intersectsSphere(sphere)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, 1, 0, -sphere.center.y + r + 0.1).intersectsSphere(sphere)).toBe(PlaneIntersectionType.Front)

      expect(Plane.create(0, 0, -1, sphere.center.z - r - 0.1).intersectsSphere(sphere)).toBe(PlaneIntersectionType.Back)
      expect(Plane.create(0, 0, -1, sphere.center.z - r).intersectsSphere(sphere)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, 0, -1, sphere.center.z).intersectsSphere(sphere)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, 0, -1, sphere.center.z + r).intersectsSphere(sphere)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, 0, -1, sphere.center.z + r + 0.1).intersectsSphere(sphere)).toBe(PlaneIntersectionType.Front)

      expect(Plane.create(0, 0, 1, -sphere.center.z - r - 0.1).intersectsSphere(sphere)).toBe(PlaneIntersectionType.Back)
      expect(Plane.create(0, 0, 1, -sphere.center.z - r).intersectsSphere(sphere)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, 0, 1, -sphere.center.z).intersectsSphere(sphere)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, 0, 1, -sphere.center.z + r).intersectsSphere(sphere)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, 0, 1, -sphere.center.z + r + 0.1).intersectsSphere(sphere)).toBe(PlaneIntersectionType.Front)
    }
  })

  it('intersectsBox', () => {
    for (let i = 0; i < 10; i++) {
      const r = Math.random()
      const point = Vec3.createRandom()
      const box = BoundingBox.create(point.x - r, point.y - r, point.z - r, point.x + r, point.y + r, point.z + r)
      expect(Plane.create(-1, 0, 0, point.x - r - 0.1).intersectsBox(box)).toBe(PlaneIntersectionType.Back)
      expect(Plane.create(-1, 0, 0, point.x - r).intersectsBox(box)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(-1, 0, 0, point.x).intersectsBox(box)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(-1, 0, 0, point.x + r).intersectsBox(box)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(-1, 0, 0, point.x + r + 0.1).intersectsBox(box)).toBe(PlaneIntersectionType.Front)

      expect(Plane.create(1, 0, 0, -point.x - r - 0.1).intersectsBox(box)).toBe(PlaneIntersectionType.Back)
      expect(Plane.create(1, 0, 0, -point.x - r).intersectsBox(box)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(1, 0, 0, -point.x).intersectsBox(box)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(1, 0, 0, -point.x + r).intersectsBox(box)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(1, 0, 0, -point.x + r + 0.1).intersectsBox(box)).toBe(PlaneIntersectionType.Front)

      expect(Plane.create(0, -1, 0, point.y - r - 0.1).intersectsBox(box)).toBe(PlaneIntersectionType.Back)
      expect(Plane.create(0, -1, 0, point.y - r).intersectsBox(box)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, -1, 0, point.y).intersectsBox(box)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, -1, 0, point.y + r).intersectsBox(box)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, -1, 0, point.y + r + 0.1).intersectsBox(box)).toBe(PlaneIntersectionType.Front)

      expect(Plane.create(0, 1, 0, -point.y - r - 0.1).intersectsBox(box)).toBe(PlaneIntersectionType.Back)
      expect(Plane.create(0, 1, 0, -point.y - r).intersectsBox(box)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, 1, 0, -point.y).intersectsBox(box)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, 1, 0, -point.y + r).intersectsBox(box)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, 1, 0, -point.y + r + 0.1).intersectsBox(box)).toBe(PlaneIntersectionType.Front)

      expect(Plane.create(0, 0, -1, point.z - r - 0.1).intersectsBox(box)).toBe(PlaneIntersectionType.Back)
      expect(Plane.create(0, 0, -1, point.z - r).intersectsBox(box)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, 0, -1, point.z).intersectsBox(box)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, 0, -1, point.z + r).intersectsBox(box)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, 0, -1, point.z + r + 0.1).intersectsBox(box)).toBe(PlaneIntersectionType.Front)

      expect(Plane.create(0, 0, 1, -point.z - r - 0.1).intersectsBox(box)).toBe(PlaneIntersectionType.Back)
      expect(Plane.create(0, 0, 1, -point.z - r).intersectsBox(box)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, 0, 1, -point.z).intersectsBox(box)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, 0, 1, -point.z + r).intersectsBox(box)).toBe(PlaneIntersectionType.Intersects)
      expect(Plane.create(0, 0, 1, -point.z + r + 0.1).intersectsBox(box)).toBe(PlaneIntersectionType.Front)
    }
  })

  it('intersectsCapsule', () => {
    pending('incomplete implementation of capsule')
    // for (let i = 0; i < 1; i++) {
    //   const r = 1
    //   const point = Vec3.createRandom().multiplyScalar(10)
    //   const capsule = BoundingCapsule.create(point.x, point.y + r, point.z, point.x, point.y - r, point.z, r)
    //   expect(Plane.create(-1, 0, 0, point.x - r - 0.1).intersectsCapsule(capsule)).toBe(PlaneIntersectionType.Back)
    //   expect(Plane.create(-1, 0, 0, point.x - r).intersectsCapsule(capsule)).toBe(PlaneIntersectionType.Intersects)
    //   expect(Plane.create(-1, 0, 0, point.x).intersectsCapsule(capsule)).toBe(PlaneIntersectionType.Intersects)
    //   expect(Plane.create(-1, 0, 0, point.x + r).intersectsCapsule(capsule)).toBe(PlaneIntersectionType.Intersects)
    //   expect(Plane.create(-1, 0, 0, point.x + r + 0.1).intersectsCapsule(capsule)).toBe(PlaneIntersectionType.Front)

    //   expect(Plane.create(1, 0, 0, -point.x - r - 0.1).intersectsCapsule(capsule)).toBe(PlaneIntersectionType.Back)
    //   expect(Plane.create(1, 0, 0, -point.x - r).intersectsCapsule(capsule)).toBe(PlaneIntersectionType.Intersects)
    //   expect(Plane.create(1, 0, 0, -point.x).intersectsCapsule(capsule)).toBe(PlaneIntersectionType.Intersects)
    //   expect(Plane.create(1, 0, 0, -point.x + r).intersectsCapsule(capsule)).toBe(PlaneIntersectionType.Intersects)
    //   expect(Plane.create(1, 0, 0, -point.x + r + 0.1).intersectsCapsule(capsule)).toBe(PlaneIntersectionType.Front)

    //   expect(Plane.create(0, -1, 0, point.y - 2 * r - 0.1).intersectsCapsule(capsule)).toBe(PlaneIntersectionType.Back)
    //   expect(Plane.create(0, -1, 0, point.y - 2 * r).intersectsCapsule(capsule)).toBe(PlaneIntersectionType.Intersects)
    //   expect(Plane.create(0, -1, 0, point.y).intersectsCapsule(capsule)).toBe(PlaneIntersectionType.Intersects)
    //   expect(Plane.create(0, -1, 0, point.y + 2 * r).intersectsCapsule(capsule)).toBe(PlaneIntersectionType.Intersects)
    //   expect(Plane.create(0, -1, 0, point.y + 2 * r + 0.1).intersectsCapsule(capsule)).toBe(PlaneIntersectionType.Front)

    //   expect(Plane.create(0, 1, 0, -(point.y - 2 * r - 0.1)).intersectsCapsule(capsule)).toBe(PlaneIntersectionType.Front)
    //   expect(Plane.create(0, 1, 0, -(point.y - 2 * r)).intersectsCapsule(capsule)).toBe(PlaneIntersectionType.Intersects)
    //   expect(Plane.create(0, 1, 0, -(point.y)).intersectsCapsule(capsule)).toBe(PlaneIntersectionType.Intersects)
    //   expect(Plane.create(0, 1, 0, -(point.y + 2 * r)).intersectsCapsule(capsule)).toBe(PlaneIntersectionType.Intersects)
    //   expect(Plane.create(0, 1, 0, -(point.y + 2 * r + 0.1)).intersectsCapsule(capsule)).toBe(PlaneIntersectionType.Back)

    //   expect(Plane.create(0, 0, -1, point.z - r - 0.1).intersectsCapsule(capsule)).toBe(PlaneIntersectionType.Back)
    //   expect(Plane.create(0, 0, -1, point.z - r).intersectsCapsule(capsule)).toBe(PlaneIntersectionType.Intersects)
    //   expect(Plane.create(0, 0, -1, point.z).intersectsCapsule(capsule)).toBe(PlaneIntersectionType.Intersects)
    //   expect(Plane.create(0, 0, -1, point.z + r).intersectsCapsule(capsule)).toBe(PlaneIntersectionType.Intersects)
    //   expect(Plane.create(0, 0, -1, point.z + r + 0.1).intersectsCapsule(capsule)).toBe(PlaneIntersectionType.Front)

    //   expect(Plane.create(0, 0, 1, -(point.z - r - 0.1)).intersectsCapsule(capsule)).toBe(PlaneIntersectionType.Front)
    //   expect(Plane.create(0, 0, 1, -(point.z - r)).intersectsCapsule(capsule)).toBe(PlaneIntersectionType.Intersects)
    //   expect(Plane.create(0, 0, 1, -(point.z)).intersectsCapsule(capsule)).toBe(PlaneIntersectionType.Intersects)
    //   expect(Plane.create(0, 0, 1, -(point.z + r)).intersectsCapsule(capsule)).toBe(PlaneIntersectionType.Intersects)
    //   expect(Plane.create(0, 0, 1, -(point.z + r + 0.1)).intersectsCapsule(capsule)).toBe(PlaneIntersectionType.Back)
    // }
  })
})
