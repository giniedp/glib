import { closestPointOnPlane, closestPointOnSegment, closestPointsOfSegments, distancePlaneToPoint } from './Collision'

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

  it('closestPointsOfSegments', () => {
    // the closest points have different parameters on each segment (s = 0.25, t = 0.75)
    const p1 = vec3()
    const p2 = vec3()
    const d = closestPointsOfSegments(vec3(-1, 0, 0), vec3(3, 0, 0), vec3(0, -3, 1), vec3(0, 1, 1), p1, p2)
    expect(p1).toEqual(vec3(0, 0, 0))
    expect(p2).toEqual(vec3(0, 0, 1))
    expect(d).toBe(1)
  })

  it('distancePlaneToPoint', () => {
    expect(distancePlaneToPoint(vec4(0, 1, 0, -1), vec3(0, 1, 0))).toBe(0)
    expect(distancePlaneToPoint(vec4(0, 1, 0, -1), vec3(0, 1.5, 0))).toBe(0.5)
    expect(distancePlaneToPoint(vec4(0, 1, 0, -1), vec3(0, 0.5, 0))).toBe(-0.5)
  })
})
