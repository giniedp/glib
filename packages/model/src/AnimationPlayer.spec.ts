import { Transform } from '@gglib/math'
import { describe, expect, it } from 'vitest'
import type { AnimationData, AnimationDataChannel } from './AnimationData'
import { AnimationChannel, AnimationPlayer } from './AnimationPlayer'

function translationClip(name: string, channel: AnimationDataChannel<any>): AnimationData {
  return {
    name,
    channels: [{ target: 0, translation: channel }],
  }
}

function linearX(times: number[]): AnimationData {
  return translationClip('linear', {
    interpolation: 'LINEAR',
    samples: times.map((time, i) => ({ time, value: { x: i, y: 0, z: 0 } })),
  })
}

describe('@gglib/model/AnimationPlayer', () => {
  it('samples a single key frame', () => {
    const target = new Transform()
    const player = new AnimationPlayer(
      [translationClip('single', { interpolation: 'LINEAR', samples: [{ time: 0, value: { x: 1, y: 2, z: 3 } }] })],
      [target],
    )
    player.play(0)
    expect(target.translation).toEqual({ x: 1, y: 2, z: 3 })
    expect(target.rotation).toEqual({ x: 0, y: 0, z: 0, w: 1 })
    expect(target.scale).toEqual({ x: 1, y: 1, z: 1 })
  })

  it('marks animated targets as changed', () => {
    const animated = new Transform()
    const other = new Transform()
    const player = new AnimationPlayer([linearX([0, 1])], [animated, other])
    animated.updateWorldTransform()
    other.updateWorldTransform()
    player.play(0)
    expect(animated.hasChanged).toBe(true)
    expect(other.hasChanged).toBe(false)
  })

  it('interpolates step', () => {
    const channel = new AnimationChannel({
      interpolation: 'STEP',
      samples: [
        { time: 0, value: { x: 1, y: 0, z: 0 } },
        { time: 2, value: { x: 0, y: 2, z: 0 } },
        { time: 3, value: { x: 0, y: 0, z: 3 } },
      ],
    })
    const out = { x: 0, y: 0, z: 0 }
    expect(channel.sampleVec3(0.0, out)).toEqual({ x: 1, y: 0, z: 0 })
    expect(channel.sampleVec3(1.99, out)).toEqual({ x: 1, y: 0, z: 0 })
    expect(channel.sampleVec3(2.0, out)).toEqual({ x: 0, y: 2, z: 0 })
    expect(channel.sampleVec3(2.5, out)).toEqual({ x: 0, y: 2, z: 0 })
    expect(channel.sampleVec3(3.0, out)).toEqual({ x: 0, y: 0, z: 3 })
  })

  it('interpolates linear', () => {
    const channel = new AnimationChannel(linearX([0, 1, 2]).channels[0].translation)
    const out = { x: 0, y: 0, z: 0 }
    expect(channel.sampleVec3(-1, out).x).toBe(0)
    expect(channel.sampleVec3(0.5, out).x).toBe(0.5)
    expect(channel.sampleVec3(1.5, out).x).toBe(1.5)
    expect(channel.sampleVec3(3.0, out).x).toBe(2)
  })

  it('finds key frames at random access and with uneven spacing', () => {
    const times = [0, 0.001, 0.002, 0.5, 0.5005, 1, 3, 3.0001, 10]
    const channel = new AnimationChannel(linearX(times).channels[0].translation)
    const out = { x: 0, y: 0, z: 0 }
    for (const time of [9, 0.0015, 3.00005, 0.25, 10, 0, 0.50025, 2]) {
      const i = channel.frame(time)
      expect(times[i]).toBeLessThanOrEqual(time)
      if (i < times.length - 1) {
        expect(times[i + 1]).toBeGreaterThan(time)
      }
      const t = i < times.length - 1 ? (time - times[i]) / (times[i + 1] - times[i]) : 0
      expect(channel.sampleVec3(time, out).x).toBeCloseTo(i + t, 5)
    }
  })

  it('interpolates rotation spherically on the shortest path', () => {
    const s = Math.SQRT1_2
    const channel = new AnimationChannel({
      interpolation: 'LINEAR',
      samples: [
        { time: 0, value: { x: 0, y: 0, z: 0, w: 1 } },
        // 180° about z, negated: the shortest path is +90° at the half
        { time: 1, value: { x: 0, y: 0, z: -1, w: -0 } },
      ],
    })
    const out = { x: 0, y: 0, z: 0, w: 0 }
    channel.sampleQuat(0.5, out)
    expect(Math.abs(out.z)).toBeCloseTo(s, 5)
    expect(Math.abs(out.w)).toBeCloseTo(s, 5)
    expect(Math.hypot(out.x, out.y, out.z, out.w)).toBeCloseTo(1, 5)
  })

  it('interpolates cubic spline with tangents scaled by delta time', () => {
    const zero = { x: 0, y: 0, z: 0 }
    const channel = new AnimationChannel({
      interpolation: 'CUBICSPLINE',
      samples: [
        { time: 0, value: { x: 0, y: 0, z: 0 }, inTangent: zero, outTangent: { x: 1, y: 0, z: 0 } },
        { time: 2, value: { x: 2, y: 0, z: 0 }, inTangent: { x: 1, y: 0, z: 0 }, outTangent: zero },
      ],
    })
    // tangents of slope 1 on a line of slope 1: the spline is the line
    const out = { x: 0, y: 0, z: 0 }
    expect(channel.sampleVec3(0.5, out).x).toBeCloseTo(0.5, 5)
    expect(channel.sampleVec3(1.0, out).x).toBeCloseTo(1.0, 5)
    expect(channel.sampleVec3(1.5, out).x).toBeCloseTo(1.5, 5)
  })

  it('clamps at the end and stops when not looping', () => {
    const target = new Transform()
    const player = new AnimationPlayer([linearX([0, 1, 2])], [target])
    player.play(0)
    player.update(1.5)
    expect(target.translation.x).toBe(1.5)
    player.update(1)
    expect(target.translation.x).toBe(2)
    expect(player.playing).toBe(false)
  })

  it('wraps when looping, also for clips not starting at 0', () => {
    const target = new Transform()
    const player = new AnimationPlayer([linearX([1, 2, 3])], [target])
    player.play(0, { loop: true })
    expect(player.time).toBe(1)
    player.update(2.5) // 3.5 -> 1.5
    expect(player.time).toBeCloseTo(1.5)
    expect(target.translation.x).toBeCloseTo(0.5)
    expect(player.playing).toBe(true)
  })

  it('plays backwards', () => {
    const target = new Transform()
    const player = new AnimationPlayer([linearX([0, 1, 2])], [target])
    player.play(0, { speed: -1, loop: true })
    expect(player.time).toBe(2)
    player.update(0.5)
    expect(target.translation.x).toBe(1.5)
    player.update(2) // -0.5 -> 1.5
    expect(player.time).toBeCloseTo(1.5)
  })

  it('finds clips by name', () => {
    const player = new AnimationPlayer([linearX([0, 1]), { ...linearX([0, 2]), name: 'walk' }], [new Transform()])
    expect(player.getClip('walk')?.duration).toBe(2)
    expect(player.getClip(5)).toBe(null)
    expect(player.play('missing')).toBe(null)
  })

  it('resets animated targets to the rest pose', () => {
    const animated = new Transform().setPosition(5, 6, 7).setScaleUniform(2)
    const other = new Transform()
    const player = new AnimationPlayer([linearX([0, 1])], [animated, other])
    player.play(0)
    expect(animated.translation).toEqual({ x: 0, y: 0, z: 0 })
    other.setPosition(1, 1, 1)
    player.reset()
    expect(player.playing).toBe(false)
    expect(animated.translation).toEqual({ x: 5, y: 6, z: 7 })
    expect(animated.scale).toEqual({ x: 2, y: 2, z: 2 })
    expect(other.translation).toEqual({ x: 1, y: 1, z: 1 })
  })
})
