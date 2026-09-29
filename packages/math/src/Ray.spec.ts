import { describe, expect, it } from 'vitest'
import {
  BoundingBox,
  BoundingSphere,
  IRay,
  IVec3,
  ray$init,
  ray$initFrom,
  rayCopy,
  rayCreate,
  rayEquals,
  rayIntersectsBox,
  rayIntersectsBoxAt,
  rayIntersectsPlane,
  rayIntersectsPlaneAt,
  rayIntersectsSphere,
  rayIntersectsSphereAt,
  rayIntersectsTriangle,
  rayIntersectsTriangleAt,
  rayPositionAt,
  vec3,
  vec4,
} from './index'

describe('ray', () => {
  function expectVec3(v: IVec3, x: number, y: number, z: number) {
    expect(v.x, 'x component').toBeCloseTo(x, 10)
    expect(v.y, 'y component').toBeCloseTo(y, 10)
    expect(v.z, 'z component').toBeCloseTo(z, 10)
  }

  function ray(px: number, py: number, pz: number, dx: number, dy: number, dz: number): IRay {
    return rayCreate(vec3(px, py, pz), vec3(dx, dy, dz))
  }

  describe('rayCreate', () => {
    it('creates zero ray', () => {
      const r = rayCreate()
      expectVec3(r.position, 0, 0, 0)
      expectVec3(r.direction, 0, 0, 0)
    })
    it('copies position and direction', () => {
      const position = vec3(1, 2, 3)
      const direction = vec3(4, 5, 6)
      const r = rayCreate(position, direction)
      expectVec3(r.position, 1, 2, 3)
      expectVec3(r.direction, 4, 5, 6)
      expect(r.position).not.toBe(position)
      expect(r.direction).not.toBe(direction)
    })
  })

  describe('ray$init', () => {
    it('sets position and direction', () => {
      const r = ray$init(rayCreate(), vec3(1, 2, 3), vec3(4, 5, 6))
      expectVec3(r.position, 1, 2, 3)
      expectVec3(r.direction, 4, 5, 6)
    })
    it('copies the vectors', () => {
      const position = vec3(1, 2, 3)
      const r = ray$init(rayCreate(), position, vec3(4, 5, 6))
      expect(r.position).not.toBe(position)
    })
    it('returns out', () => {
      const out = rayCreate()
      expect(ray$init(out, vec3(1, 2, 3), vec3(4, 5, 6))).toBe(out)
    })
  })

  describe('ray$initFrom', () => {
    it('copies components', () => {
      const r = ray$initFrom(rayCreate(), ray(1, 2, 3, 4, 5, 6))
      expectVec3(r.position, 1, 2, 3)
      expectVec3(r.direction, 4, 5, 6)
    })
    it('returns out', () => {
      const out = rayCreate()
      expect(ray$initFrom(out, ray(1, 2, 3, 4, 5, 6))).toBe(out)
    })
  })

  describe('rayCopy', () => {
    it('creates copy', () => {
      const r = ray(1, 2, 3, 4, 5, 6)
      const result = rayCopy(r)
      expect(result).not.toBe(r)
      expect(result.position).not.toBe(r.position)
      expect(result.direction).not.toBe(r.direction)
      expectVec3(result.position, 1, 2, 3)
      expectVec3(result.direction, 4, 5, 6)
    })
    it('writes to out', () => {
      const out = rayCreate()
      expect(rayCopy(ray(1, 2, 3, 4, 5, 6), out)).toBe(out)
      expectVec3(out.position, 1, 2, 3)
      expectVec3(out.direction, 4, 5, 6)
    })
  })

  describe('rayEquals', () => {
    it('compares all components', () => {
      expect(rayEquals(ray(1, 2, 3, 4, 5, 6), ray(1, 2, 3, 4, 5, 6))).toBe(true)
      const parts = [1, 2, 3, 4, 5, 6]
      for (let i = 0; i < parts.length; i++) {
        const other = [...parts]
        other[i] = 100
        const [px, py, pz, dx, dy, dz] = other
        expect(rayEquals(ray(1, 2, 3, 4, 5, 6), ray(px, py, pz, dx, dy, dz)), `component ${i}`).toBe(false)
      }
    })
  })

  describe('rayPositionAt', () => {
    it('gets position at distance', () => {
      expectVec3(rayPositionAt(ray(1, 2, 3, 1, 1, 1), 10), 11, 12, 13)
    })
    it('writes to out', () => {
      const out = vec3()
      expect(rayPositionAt(ray(1, 2, 3, 1, 1, 1), 10, out)).toBe(out)
      expectVec3(out, 11, 12, 13)
    })
  })

  // rays that start outside a unit volume at the origin
  // [description, ray, hits]
  const outsideCases: Array<[string, IRay, boolean]> = [
    ['from -x towards the volume', ray(-2, 0, 0, 1, 0, 0), true],
    ['from +x towards the volume', ray(2, 0, 0, -1, 0, 0), true],
    ['from -y towards the volume', ray(0, -2, 0, 0, 1, 0), true],
    ['from +y towards the volume', ray(0, 2, 0, 0, -1, 0), true],
    ['from -z towards the volume', ray(0, 0, -2, 0, 0, 1), true],
    ['from +z towards the volume', ray(0, 0, 2, 0, 0, -1), true],
    ['from -x away from the volume', ray(-2, 0, 0, -1, 0, 0), false],
    ['from +x away from the volume', ray(2, 0, 0, 1, 0, 0), false],
    ['from -y away from the volume', ray(0, -2, 0, 0, -1, 0), false],
    ['from +y away from the volume', ray(0, 2, 0, 0, 1, 0), false],
    ['from -z away from the volume', ray(0, 0, -2, 0, 0, -1), false],
    ['from +z away from the volume', ray(0, 0, 2, 0, 0, 1), false],
    ['along x, passing by', ray(-2, 1, 1, 1, 0, 0), false],
    ['along y, passing by', ray(1, -2, 1, 0, 1, 0), false],
    ['along z, passing by', ray(1, 1, -2, 0, 0, 1), false],
  ]

  describe('rayIntersectsSphere', () => {
    const sphere = new BoundingSphere(0, 0, 0, 1)
    it('hits from inside', () => {
      expect(rayIntersectsSphere(ray(0, 0, 0, 1, 0, 0), sphere)).toBe(true)
    })
    for (const [name, r, hits] of outsideCases) {
      it(`${hits ? 'hits' : 'misses'} ${name}`, () => {
        expect(rayIntersectsSphere(r, sphere)).toBe(hits)
      })
    }
  })

  describe('rayIntersectsSphereAt', () => {
    const sphere = new BoundingSphere(0, 0, 0, 1)
    it('gets distance to exit point from inside', () => {
      expect(rayIntersectsSphereAt(ray(0, 0, 0, 1, 0, 0), sphere)).toBe(1)
      expect(rayIntersectsSphereAt(ray(0.5, 0, 0, 1, 0, 0), sphere)).toBe(0.5)
    })
    for (const [name, r, hits] of outsideCases) {
      it(`${hits ? 'gets distance' : 'returns NaN'} ${name}`, () => {
        expect(rayIntersectsSphereAt(r, sphere)).toEqual(hits ? 1 : Number.NaN)
      })
    }
  })

  describe('rayIntersectsBox', () => {
    const box = new BoundingBox(-0.9, -0.9, -0.9, 0.9, 0.9, 0.9)
    it('hits from inside', () => {
      expect(rayIntersectsBox(ray(0, 0, 0, 1, 0, 0), box)).toBe(true)
    })
    for (const [name, r, hits] of outsideCases) {
      it(`${hits ? 'hits' : 'misses'} ${name}`, () => {
        expect(rayIntersectsBox(r, box)).toBe(hits)
      })
    }
  })

  describe('rayIntersectsBoxAt', () => {
    const box = new BoundingBox(-0.9, -0.9, -0.9, 0.9, 0.9, 0.9)
    it('gets 0 from inside', () => {
      expect(rayIntersectsBoxAt(ray(0, 0, 0, 1, 0, 0), box)).toBeCloseTo(0)
    })
    for (const [name, r, hits] of outsideCases) {
      it(`${hits ? 'gets distance' : 'returns NaN'} ${name}`, () => {
        if (hits) {
          expect(rayIntersectsBoxAt(r, box)).toBeCloseTo(1.1)
        } else {
          expect(rayIntersectsBoxAt(r, box)).toEqual(Number.NaN)
        }
      })
    }
  })

  describe('rayIntersectsPlane', () => {
    // plane with normal +y at distance 1 from the origin
    const plane = vec4(0, 1, 0, 1)
    it('hits plane in front', () => {
      expect(rayIntersectsPlane(ray(0, 0, 0, 0, 1, 0), plane)).toBe(true)
    })
    it('misses plane behind', () => {
      expect(rayIntersectsPlane(ray(0, 0, 0, 0, -1, 0), plane)).toBe(false)
    })
  })

  describe('rayIntersectsPlaneAt', () => {
    const plane = vec4(0, 1, 0, 1)
    it('gets distance to plane', () => {
      expect(rayIntersectsPlaneAt(ray(0, 0, 0, 0, 1, 0), plane)).toBeCloseTo(1)
      expect(rayIntersectsPlaneAt(ray(0, -1, 0, 0, 1, 0), plane)).toBeCloseTo(2)
    })
    it('returns NaN for parallel ray', () => {
      expect(rayIntersectsPlaneAt(ray(0, 0, 0, 1, 0, 0), plane)).toEqual(Number.NaN)
    })
  })

  describe('triangle', () => {
    // triangle in the xy plane, counter clockwise when looking along -z, front face points to +z
    const a = vec3(0, 0, 0)
    const b = vec3(1, 0, 0)
    const c = vec3(0, 1, 0)

    describe('rayIntersectsTriangle', () => {
      it('hits from the front', () => {
        expect(rayIntersectsTriangle(ray(0.2, 0.2, 1, 0, 0, -1), a, b, c)).toBe(true)
      })
      it('misses when pointing away', () => {
        expect(rayIntersectsTriangle(ray(0.2, 0.2, 1, 0, 0, 1), a, b, c)).toBe(false)
      })
      it('misses outside the triangle', () => {
        expect(rayIntersectsTriangle(ray(0.8, 0.8, 1, 0, 0, -1), a, b, c)).toBe(false)
      })
    })

    describe('rayIntersectsTriangleAt', () => {
      it('gets distance from the front', () => {
        expect(rayIntersectsTriangleAt(ray(0.2, 0.2, 2, 0, 0, -1), a, b, c)).toBeCloseTo(2)
      })
      it('returns NaN when pointing away', () => {
        expect(rayIntersectsTriangleAt(ray(0.2, 0.2, 2, 0, 0, 1), a, b, c)).toEqual(Number.NaN)
      })
      it('returns NaN outside the triangle', () => {
        expect(rayIntersectsTriangleAt(ray(0.8, 0.8, 2, 0, 0, -1), a, b, c)).toEqual(Number.NaN)
      })
    })
  })
})
