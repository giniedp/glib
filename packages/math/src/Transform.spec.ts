import { describe, expect, it } from 'vitest'
import { mat4$initFrom, mat4CreateRotationZ, mat4CreateTranslationXYZ, mat4Multiply } from './Mat4'
import { quat$initFromMat4, quatCreateIdentity, quatMultiply } from './Quat'
import { Transform } from './Transform'

/**
 * A transform whose world matrix is set directly, as a component's `world` option does before any update
 */
function placed(world: ReturnType<typeof mat4CreateTranslationXYZ>) {
  const result = new Transform()
  mat4$initFrom(result.world, world)
  mat4$initFrom(result.matrix, world)
  return result
}

describe('Transform', () => {
  it('inverts a world matrix that was set before the first update', () => {
    const parent = placed(mat4CreateTranslationXYZ(100, 200, 300))
    expect(Array.from(parent.worldInverse.slice(12, 15))).toEqual([-100, -200, -300])
  })

  it('keeps the world of a child added in world space to a placed parent', () => {
    const parent = placed(mat4CreateTranslationXYZ(100, 0, 0))
    const child = placed(mat4CreateTranslationXYZ(110, 0, 0))
    child.setParentInWorld(parent)
    expect(child.translation.x).toBeCloseTo(10)
  })

  it('returns the inverse world rotation and keeps the world rotation', () => {
    const t = placed(mat4Multiply(mat4CreateTranslationXYZ(1, 2, 3), mat4CreateRotationZ(Math.PI / 2)))
    const rotation = quat$initFromMat4(quatCreateIdentity(), t.world)
    const product = quatMultiply(t.worldRotationInverse, rotation)
    expect(product.w).toBeCloseTo(1)
    expect(t.worldRotation.z).toBeCloseTo(rotation.z)
  })
})
