import { GameWorld } from '@gglib/ecs'
import { GameLoop } from '@gglib/game'
import {
  BoundingBox,
  BoundingCylinder,
  BoundingOrientedBox,
  BoundingSphere,
  mat4Identity,
  rayCreate,
  vec3,
} from '@gglib/math'
import { beforeEach, describe, expect, it } from 'vitest'
import { DebugDrawSystem } from './DebugDrawSystem'

describe('DebugDrawSystem', () => {
  let world: GameWorld
  let loop: GameLoop
  let debug: DebugDrawSystem

  beforeEach(() => {
    world = new GameWorld()
    loop = new GameLoop()
    debug = new DebugDrawSystem()
    world.addSystem(loop)
    world.addSystem(debug)
    world.initialize()
  })

  it('draws lines', () => {
    debug.line(vec3(0), vec3(1))
    debug.ray(rayCreate(vec3(0), vec3(1, 0, 0)), 5)
    expect(debug.vertexCount).toBe(4)
  })

  it('draws points and axes', () => {
    debug.point(vec3(0))
    debug.axes(mat4Identity())
    expect(debug.vertexCount).toBe(12)
  })

  it('draws boxes with 12 edges', () => {
    debug.box(new BoundingBox(-1, -1, -1, 1, 1, 1))
    expect(debug.vertexCount).toBe(24)
    debug.orientedBox(BoundingOrientedBox.create(vec3(0), vec3(1)))
    expect(debug.vertexCount).toBe(48)
  })

  it('draws spheres and cylinders with circles', () => {
    debug.segments = 8
    debug.sphere(new BoundingSphere(0, 0, 0, 1))
    expect(debug.vertexCount).toBe(3 * 8 * 2)
    debug.clear()
    debug.cylinder(BoundingCylinder.create(vec3(0), 1, 2))
    expect(debug.vertexCount).toBe(2 * 8 * 2 + 4 * 2)
  })

  it('dispatches volumes by type', () => {
    debug.segments = 8
    debug.volume(new BoundingBox(-1, -1, -1, 1, 1, 1))
    debug.volume(BoundingOrientedBox.create(vec3(0), vec3(1)))
    debug.volume(new BoundingSphere(0, 0, 0, 1))
    debug.volume(BoundingCylinder.create(vec3(0), 1, 2))
    expect(debug.vertexCount).toBe(24 + 24 + 48 + 40)
  })

  it('draws a cylinder along any axis', () => {
    const cylinder = BoundingCylinder.create(vec3(0), 1, 2)
    cylinder.axis.x = 1
    cylinder.axis.y = 0
    debug.cylinder(cylinder)
    expect(debug.vertexCount).toBeGreaterThan(0)
  })

  it('grows the buffer', () => {
    for (let i = 0; i < 2000; i++) {
      debug.line(vec3(0), vec3(i))
    }
    expect(debug.vertexCount).toBe(4000)
  })

  it('ignores draw calls while disabled', () => {
    debug.enabled = false
    debug.line(vec3(0), vec3(1))
    debug.sphere(new BoundingSphere(0, 0, 0, 1))
    expect(debug.vertexCount).toBe(0)
  })

  it('clears on each update of the game loop', () => {
    debug.line(vec3(0), vec3(1))
    loop.onUpdate.emit(null)
    expect(debug.vertexCount).toBe(0)
  })
})
