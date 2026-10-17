import { WebglDevice, type Device } from '@gglib/graphics'
import { mat4CreateTranslationXYZ, mat4Invert, mat4Multiply, Transform } from '@gglib/math'
import { beforeEach, describe, expect, it } from 'vitest'
import { Skeleton, SKELETON_MAX_JOINTS_WEBGL } from './Skeleton'

describe('@gglib/model/Skeleton', () => {
  let device: Device

  beforeEach(() => {
    device = new WebglDevice({})
  })

  function bones() {
    const root = new Transform().setPosition(10, 0, 0)
    const bone0 = new Transform().setPosition(0, 1, 0)
    const bone1 = new Transform().setPosition(0, 2, 0)
    root.addChild(bone0)
    bone0.addChild(bone1)
    root.propagateUpdates(false, true)
    return { root, bone0, bone1 }
  }

  it('keeps the inverse bind matrices', () => {
    const { bone0, bone1 } = bones()
    const ibm = [mat4CreateTranslationXYZ(0, -1, 0), mat4CreateTranslationXYZ(0, -3, 0)]
    const skeleton = new Skeleton(device, [bone0, bone1], ibm)
    expect(skeleton.inverseBindMatrices).toBe(ibm)
  })

  it('computes joint matrices relative to the root', () => {
    const { root, bone0, bone1 } = bones()
    // inverse bind matrices are in model space. Bind pose equals the current pose: joint matrices are identity
    const bind = (bone: Transform) => mat4Invert(mat4Multiply(mat4Invert(root.world), bone.world))
    const skeleton = new Skeleton(device, [bone0, bone1], [bind(bone0), bind(bone1)])
    // the root translation is canceled by the root inverse
    skeleton.update(mat4Invert(root.world))
    const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    for (let i = 0; i < 2; i++) {
      Array.from(skeleton.jointMatrices.subarray(i * 16, i * 16 + 16)).forEach((v, j) => {
        expect(v).toBeCloseTo(identity[j], 5)
      })
    }

    // moving a bone moves its joint and the child joint
    bone0.setPosition(0, 1, 5)
    root.propagateUpdates(false, true)
    skeleton.update(mat4Invert(root.world))
    expect(skeleton.jointMatrices[14]).toBeCloseTo(5, 5)
    expect(skeleton.jointMatrices[16 + 14]).toBeCloseTo(5, 5)
  })

  it('reuses its arrays on update', () => {
    const { root, bone0, bone1 } = bones()
    const skeleton = new Skeleton(device, [bone0, bone1], [mat4Invert(bone0.world), mat4Invert(bone1.world)])
    const data = skeleton.jointMatrices
    const buffer = skeleton.buffer
    skeleton.update(mat4Invert(root.world))
    expect(skeleton.jointMatrices).toBe(data)
    expect(skeleton.buffer).toBe(buffer)
  })

  it('sizes the WebGL buffer to the uniform block', () => {
    const { bone0 } = bones()
    const skeleton = new Skeleton(device, [bone0], [mat4Invert(bone0.world)])
    expect(skeleton.buffer.size).toBe(SKELETON_MAX_JOINTS_WEBGL * 64)
  })

  it('throws if bones and inverse bind matrices do not match', () => {
    const { bone0 } = bones()
    expect(() => new Skeleton(device, [bone0], [])).toThrow()
  })
})
