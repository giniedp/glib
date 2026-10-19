import { GameWorld } from '@gglib/ecs'
import { vec3 } from '@gglib/math'
import { beforeEach, describe, expect, it } from 'vitest'
import { Tween, TweenSystem } from './TweenSystem'

describe('Tween', () => {
  it('interpolates scalars', () => {
    const tween = new Tween({ from: 0, to: 10, duration: 1 }).play()
    tween.advance(0.25)
    expect(tween.value).toBeCloseTo(2.5)
    expect(tween.isPlaying).toBe(true)
    tween.advance(1)
    expect(tween.value).toBe(10)
    expect(tween.isIdle).toBe(true)
  })

  it('interpolates vectors', () => {
    const tween = new Tween({ from: vec3(0, 0, 0), to: vec3(2, 4, 6), duration: 1 }).play()
    tween.advance(0.5)
    expect([tween.x, tween.y, tween.z, tween.w]).toEqual([1, 2, 3, 0])
  })

  it('waits for delay', () => {
    const tween = new Tween({ from: 0, to: 1, duration: 1, delay: 0.5 }).play()
    let updates = 0
    tween.onUpdate = () => updates++
    tween.advance(0.4)
    expect(updates).toBe(0)
    tween.advance(0.6)
    expect(tween.value).toBeCloseTo(0.5)
    expect(updates).toBe(1)
  })

  it('runs to and back with yoyo and ends at start value', () => {
    let completed = 0
    const tween = new Tween({ from: 0, to: 1, duration: 1, yoyo: true, onComplete: () => completed++ }).play()
    tween.advance(1.25)
    expect(tween.value).toBeCloseTo(0.75)
    tween.advance(1)
    expect(tween.value).toBe(0)
    expect(completed).toBe(1)
  })

  it('repeats round trips with yoyo', () => {
    const tween = new Tween({ from: 0, to: 1, duration: 1, repeat: 1, yoyo: true }).play()
    tween.advance(2.5)
    expect(tween.value).toBeCloseTo(0.5)
    expect(tween.isPlaying).toBe(true)
    tween.advance(1.5)
    expect(tween.value).toBe(0)
    expect(tween.isIdle).toBe(true)
  })

  it('pauses, resumes, stops and finishes', () => {
    let completed = 0
    const tween = new Tween({ from: 0, to: 1, duration: 1, onComplete: () => completed++ }).play()
    tween.pause().advance(0.5)
    expect(tween.value).toBe(0)
    tween.resume().advance(0.5)
    expect(tween.value).toBe(0.5)
    tween.stop().finish()
    expect(completed).toBe(0)
    tween.play().finish()
    expect(tween.value).toBe(1)
    expect(completed).toBe(1)
  })

  it('completes zero duration tweens immediately', () => {
    const tween = new Tween({ from: 0, to: 1, duration: 0 }).play().advance(0)
    expect(tween.value).toBe(1)
    expect(tween.isIdle).toBe(true)
  })
})

describe('TweenSystem', () => {
  let system: TweenSystem

  beforeEach(() => {
    const world = new GameWorld()
    system = new TweenSystem()
    world.addSystem(system)
    world.initializeSystems()
  })

  it('advances and releases tweens', () => {
    const tween = system.play({ from: 0, to: 1, duration: 1 })
    system.update(0, 0.5)
    expect(tween.value).toBe(0.5)
    system.update(0, 0.5)
    expect(tween.isIdle).toBe(true)
    expect(tween.queued).toBe(false)
  })

  it('replays a tween from its complete callback', () => {
    let completed = 0
    const tween = system.play({
      from: 0,
      to: 1,
      duration: 1,
      onComplete: (t) => completed++ < 1 && t.play(),
    })
    system.update(0, 1)
    expect(tween.isPlaying).toBe(true)
    system.update(0, 1)
    expect(completed).toBe(2)
    expect(tween.isIdle).toBe(true)
  })

  it('stops all tweens', () => {
    const a = system.play({ from: 0, to: 1 })
    const b = system.play({ from: 0, to: 1 })
    system.stopAll().update(0, 0.1)
    expect(a.value).toBe(0)
    expect(b.isIdle).toBe(true)
  })
})
