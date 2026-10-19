import { GameEntity, GameWorld } from '@gglib/ecs'
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
import { SceneComponent } from '../components/SceneComponent'
import { TransformComponent } from '../components/TransformComponent'
import { DebugDraw, DebugDrawSystem } from './DebugDrawSystem'
import { SceneSystem } from './SceneSystem'

describe('DebugDrawSystem', () => {
  let world: GameWorld
  let loop: GameLoop
  let debug: DebugDrawSystem
  let scene: GameEntity
  let draw: DebugDraw

  beforeEach(() => {
    world = new GameWorld()
    loop = new GameLoop()
    debug = new DebugDrawSystem()
    world.addSystem(loop)
    world.addSystem(new SceneSystem(world))
    world.addSystem(debug)
    scene = createScene()
    world.initialize()
    scene.activate()
    draw = debug.in(scene.$(SceneComponent))
  })

  function createScene() {
    return world.createEntity({
      transform: new TransformComponent(),
      components: [new SceneComponent()],
    })
  }

  it('resolves the drawer of a scene', () => {
    const other = createScene()
    other.initialize()
    other.activate()
    const child = world.createEntity({ parent: other, transform: new TransformComponent() })
    expect(debug.in(scene.$(SceneComponent))).toBe(draw)
    expect(debug.in(child)).toBe(debug.in(other.$(SceneComponent)))
    expect(debug.in(child)).not.toBe(draw)

    const outside = world.createEntity({ transform: new TransformComponent() })
    outside.initialize()
    outside.activate()
    expect(debug.in(outside)).toBe(null)
  })

  it('clears all scenes', () => {
    const other = createScene()
    other.initialize()
    other.activate()
    draw.line(vec3(0), vec3(1))
    debug.in(other.$(SceneComponent)).line(vec3(0), vec3(1))
    debug.clear()
    expect(draw.vertexCount).toBe(0)
    expect(debug.in(other.$(SceneComponent)).vertexCount).toBe(0)
  })

  it('draws lines', () => {
    draw.line(vec3(0), vec3(1))
    draw.ray(rayCreate(vec3(0), vec3(1, 0, 0)), 5)
    expect(draw.vertexCount).toBe(4)
  })

  it('draws points and axes', () => {
    draw.point(vec3(0))
    draw.axes(mat4Identity())
    expect(draw.vertexCount).toBe(12)
  })

  it('draws boxes with 12 edges', () => {
    draw.box(new BoundingBox(-1, -1, -1, 1, 1, 1))
    expect(draw.vertexCount).toBe(24)
    draw.orientedBox(BoundingOrientedBox.create(vec3(0), vec3(1)))
    expect(draw.vertexCount).toBe(48)
  })

  it('draws spheres and cylinders with circles', () => {
    debug.segments = 8
    draw.sphere(new BoundingSphere(0, 0, 0, 1))
    expect(draw.vertexCount).toBe(3 * 8 * 2)
    debug.clear()
    draw.cylinder(BoundingCylinder.create(vec3(0), 1, 2))
    expect(draw.vertexCount).toBe(2 * 8 * 2 + 4 * 2)
  })

  it('dispatches volumes by type', () => {
    debug.segments = 8
    draw.volume(new BoundingBox(-1, -1, -1, 1, 1, 1))
    draw.volume(BoundingOrientedBox.create(vec3(0), vec3(1)))
    draw.volume(new BoundingSphere(0, 0, 0, 1))
    draw.volume(BoundingCylinder.create(vec3(0), 1, 2))
    expect(draw.vertexCount).toBe(24 + 24 + 48 + 40)
  })

  it('draws a cylinder along any axis', () => {
    const cylinder = BoundingCylinder.create(vec3(0), 1, 2)
    cylinder.axis.x = 1
    cylinder.axis.y = 0
    draw.cylinder(cylinder)
    expect(draw.vertexCount).toBeGreaterThan(0)
  })

  it('grows the buffer', () => {
    for (let i = 0; i < 2000; i++) {
      draw.line(vec3(0), vec3(i))
    }
    expect(draw.vertexCount).toBe(4000)
  })

  it('ignores draw calls while disabled', () => {
    debug.enabled = false
    draw.line(vec3(0), vec3(1))
    draw.sphere(new BoundingSphere(0, 0, 0, 1))
    expect(draw.vertexCount).toBe(0)
  })

  it('clears on each update of the game loop', () => {
    draw.line(vec3(0), vec3(1))
    loop.onUpdate.emit(null)
    expect(draw.vertexCount).toBe(0)
  })
})
