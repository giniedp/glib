import { BoundingBox, BoundingSphere, IVec3, Ray, Vec3 } from '@glib/math'

describe('Ray', () => {
  describe('clone', () => {
    it('clones', () => {
      const ray1 = new Ray(new Vec3(1, 2, 3), new Vec3(4, 5, 6))
      const ray2 = ray1.clone()
      expect(ray1).not.toBe(ray2)
      expect(ray1.direction).not.toBe(ray2.direction)
      expect(ray1.position).not.toBe(ray2.position)
      expect(Vec3.format(ray1.direction)).toEqual(Vec3.format(ray2.direction))
      expect(Vec3.format(ray1.position)).toEqual(Vec3.format(ray2.position))
    })
  })

  describe('copy', () => {
    it('copies', () => {
      const ray1 = new Ray(new Vec3(1, 2, 3), new Vec3(4, 5, 6))
      const ray2 = new Ray(new Vec3(7, 6, 9), new Vec3(10, 11, 12))
      ray1.copy(ray2)
      expect(ray1).not.toBe(ray2)
      expect(ray1.direction).not.toBe(ray2.direction)
      expect(ray1.position).not.toBe(ray2.position)
      expect(Vec3.format(ray1.direction)).toEqual(Vec3.format(ray2.direction))
      expect(Vec3.format(ray1.position)).toEqual(Vec3.format(ray2.position))
    })
  })

  describe('positionAt', () => {
    it('returns position at distance', () => {
      const ray1 = new Ray(new Vec3(1, 2, 3), new Vec3(1, 1, 1))
      const pos = ray1.positionAt(10)
      expect(pos.x).toBeCloseTo(11)
      expect(pos.y).toBeCloseTo(12)
      expect(pos.z).toBeCloseTo(13)
    })
  })

  describe('intersection', () => {
    it('intersects sphere', () => {
      const ray1 = new Ray(new Vec3(1, 0, 0), new Vec3(0, 1, 0))
      const sphere = new BoundingSphere({ x: 1, y: 10, z: 0 }, 2)
      expect(ray1.intersectsSphere(sphere)).toBe(true)
      expect(ray1.intersectsSphereAt(sphere)).toBeCloseTo(8)
    })

    it('intersects box', () => {
      const ray1 = new Ray(new Vec3(0, 0, 0), new Vec3(0, 1, 0))
      const box = new BoundingBox({ x: -1, y: 10, z: -1 }, { x: 1, y: 20, z: 1 })
      expect(ray1.intersectsBox(box)).toBe(true)
      expect(ray1.intersectsBoxAt(box)).toBeCloseTo(10)
    })

    it('intersects plane', () => {
      const ray1 = new Ray(new Vec3(0, 0, 0), new Vec3(0, 1, 0))
      const box = new BoundingBox({ x: -1, y: 10, z: -1 }, { x: 1, y: 20, z: 1 })
      expect(ray1.intersectsBox(box)).toBe(true)
      expect(ray1.intersectsBoxAt(box)).toBeCloseTo(10)
    })
  })
})
