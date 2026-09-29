import { closestPointOnPlane, closestPointOnSegment, distancePlaneToPoint } from './Collision'

import { describe, expect, it } from 'vitest'
import { vec3 } from './Vec3'
import { vec4 } from './Vec4'

describe('Collision', () => {
  it('closestPointOnSegment', () => {
    const start = vec3(-1, 1, 0)
    const end = vec3(1, 1, 0)
    expect(closestPointOnSegment(vec3(0, 0, 0), start, end, {})).toEqual(vec3(0, 1, 0))
    expect(closestPointOnSegment(vec3(-2, 0, 0), start, end, {})).toEqual(vec3(-1, 1, 0))
    expect(closestPointOnSegment(vec3(2, 0, 0), start, end, {})).toEqual(vec3(1, 1, 0))
  })

  it('closestPointOnPlane', () => {
    const plane = vec4(0, 1, 0, -2)
    expect(closestPointOnPlane(vec3(0, 0, 0), plane, {})).toEqual(vec3(0, 2, 0))
    expect(closestPointOnPlane(vec3(-1, 0, 0), plane, {})).toEqual(vec3(-1, 2, 0))
    expect(closestPointOnPlane(vec3(1, 0, 0), plane, {})).toEqual(vec3(1, 2, 0))
    expect(closestPointOnPlane(vec3(1, 4, 3), plane, {})).toEqual(vec3(1, 2, 3))
  })

  it('distancePlaneToPoint', () => {
    expect(distancePlaneToPoint(vec4(0, 1, 0, -1), vec3(0, 1, 0))).toBe(0)
    expect(distancePlaneToPoint(vec4(0, 1, 0, -1), vec3(0, 1.5, 0))).toBe(0.5)
    expect(distancePlaneToPoint(vec4(0, 1, 0, -1), vec3(0, 0.5, 0))).toBe(-0.5)
  })
})
