import {
  closestPointOnPlane,
  closestPointOnSegment,
  distancePlaneToPoint,
} from './Collision'

import { Vec3 } from './Vec3'
import { Vec4 } from './Vec4'

describe('Collision', () => {
  it('closestPointOnSegment', () => {
    const start = Vec4.create(-1, 1, 0)
    const end = Vec4.create(1, 1, 0)
    expect(closestPointOnSegment(Vec3.create( 0, 0, 0), start, end, {})).toEqual(Vec3.init({},  0, 1, 0))
    expect(closestPointOnSegment(Vec3.create(-2, 0, 0), start, end, {})).toEqual(Vec3.init({}, -1, 1, 0))
    expect(closestPointOnSegment(Vec3.create( 2, 0, 0), start, end, {})).toEqual(Vec3.init({},  1, 1, 0))
  })

  it('closestPointOnPlane', () => {
    const plane = Vec4.init({}, 0, 1, 0, -2)
    expect(closestPointOnPlane(Vec3.create( 0, 0, 0), plane, {})).toEqual(Vec3.init({},   0, 2, 0))
    expect(closestPointOnPlane(Vec3.create( -1, 0, 0), plane, {})).toEqual(Vec3.init({}, -1, 2, 0))
    expect(closestPointOnPlane(Vec3.create(  1, 0, 0), plane, {})).toEqual(Vec3.init({},  1, 2, 0))
    expect(closestPointOnPlane(Vec3.create(  1, 4, 3), plane, {})).toEqual(Vec3.init({},  1, 2, 3))
  })

  it('distancePlaneToPoint', () => {
    expect(distancePlaneToPoint(Vec4.create(0, 1, 0, -1), Vec3.create(0, 1, 0))).toBe(0)
    expect(distancePlaneToPoint(Vec4.create(0, 1, 0, -1), Vec3.create(0, 1.5, 0))).toBe(0.5)
    expect(distancePlaneToPoint(Vec4.create(0, 1, 0, -1), Vec3.create(0, 0.5, 0))).toBe(-0.5)
  })
})
