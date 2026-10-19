import { GameEntity, GameWorld } from '@gglib/ecs'
import { IVec3, quatCreateAxisAngle, rayCreate, vec3 } from '@gglib/math'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  boxCollider,
  ColliderComponent,
  CollisionEvent,
  cylinderCollider,
  sphereCollider,
} from '../components/ColliderComponent'
import { SceneComponent } from '../components/SceneComponent'
import { TransformComponent } from '../components/TransformComponent'
import { CollisionSystem } from './CollisionSystem'
import { DebugDrawSystem } from './DebugDrawSystem'
import { SceneSystem } from './SceneSystem'

describe('CollisionSystem', () => {
  let world: GameWorld
  let system: CollisionSystem

  beforeEach(() => {
    world = new GameWorld()
    system = new CollisionSystem()
    world.addSystem(system)
    world.initialize()
  })

  function create(position: IVec3, collider: ColliderComponent, parent?: GameEntity) {
    const entity = world.createEntity({
      parent,
      transform: new TransformComponent({ position }),
      components: [collider],
    })
    if (!parent) {
      entity.initialize()
      entity.activate()
    }
    return entity
  }

  function record(entity: GameEntity) {
    const log: string[] = []
    const name = (e: CollisionEvent) => e.other.entity.name
    entity.events.on(ColliderComponent.onCollisionEnter, (e) => log.push(`enter ${name(e)}`))
    entity.events.on(ColliderComponent.onCollisionStay, (e) => log.push(`stay ${name(e)}`))
    entity.events.on(ColliderComponent.onCollisionExit, (e) => log.push(`exit ${name(e)}`))
    return log
  }

  function update() {
    world.update(0, 0)
  }

  describe('events', () => {
    it('emits enter once on both entities', () => {
      const a = create(vec3(0), sphereCollider(1))
      const b = create(vec3(1.5, 0, 0), sphereCollider(1))
      a.name = 'a'
      b.name = 'b'
      const logA = record(a)
      const logB = record(b)
      update()
      update()
      expect(logA).toEqual(['enter b'])
      expect(logB).toEqual(['enter a'])
    })

    it('passes self and other', () => {
      const a = create(vec3(0), sphereCollider(1))
      const b = create(vec3(1.5, 0, 0), sphereCollider(1))
      const events: CollisionEvent[] = []
      a.events.on(ColliderComponent.onCollisionEnter, (e) => events.push(e))
      update()
      expect(events.length).toBe(1)
      expect(events[0].self).toBe(a.component(ColliderComponent))
      expect(events[0].other).toBe(b.component(ColliderComponent))
    })

    it('emits stay only to colliders that opt in', () => {
      const a = create(vec3(0), sphereCollider(1, { emitStay: true }))
      const b = create(vec3(1.5, 0, 0), sphereCollider(1))
      a.name = 'a'
      b.name = 'b'
      const logA = record(a)
      const logB = record(b)
      update()
      update()
      update()
      expect(logA).toEqual(['enter b', 'stay b', 'stay b'])
      expect(logB).toEqual(['enter a'])
    })

    it('emits exit when moved apart', () => {
      const a = create(vec3(0), sphereCollider(1))
      const b = create(vec3(1.5, 0, 0), sphereCollider(1))
      b.name = 'b'
      const log = record(a)
      update()
      b.getTransform<TransformComponent>().setPosition(3, 0, 0)
      update()
      update()
      expect(log).toEqual(['enter b', 'exit b'])
    })

    it('emits exit when disabled, deactivated or destroyed', () => {
      const a = create(vec3(0), sphereCollider(1))
      const b = create(vec3(1.5, 0, 0), sphereCollider(1))
      const c = create(vec3(-1.5, 0, 0), sphereCollider(1))
      const d = create(vec3(0, 1.5, 0), sphereCollider(1))
      b.name = 'b'
      c.name = 'c'
      d.name = 'd'
      const log = record(a)
      update()
      b.component(ColliderComponent).enabled = false
      c.deactivate()
      d.destroy()
      update()
      expect(log.slice(0, 3).sort()).toEqual(['enter b', 'enter c', 'enter d'])
      expect(log.slice(3).sort()).toEqual(['exit b', 'exit c', 'exit d'])
    })

    it('enters again after re-enabling', () => {
      const a = create(vec3(0), sphereCollider(1))
      const b = create(vec3(1.5, 0, 0), sphereCollider(1))
      b.name = 'b'
      const log = record(a)
      update()
      b.component(ColliderComponent).enabled = false
      update()
      b.component(ColliderComponent).enabled = true
      update()
      expect(log).toEqual(['enter b', 'exit b', 'enter b'])
    })

    it('routes events to the world event bus', () => {
      create(vec3(0), sphereCollider(1))
      create(vec3(1.5, 0, 0), sphereCollider(1))
      let count = 0
      world.eventBus.on(ColliderComponent.onCollisionEnter, () => count++)
      update()
      expect(count).toBe(2)
    })
  })

  describe('debug', () => {
    it('updates the colliding flag', () => {
      const a = create(vec3(0), sphereCollider(1))
      const b = create(vec3(1.5, 0, 0), sphereCollider(1))
      const c = create(vec3(5, 0, 0), sphereCollider(1))
      update()
      expect(a.component(ColliderComponent).colliding).toBe(true)
      expect(b.component(ColliderComponent).colliding).toBe(true)
      expect(c.component(ColliderComponent).colliding).toBe(false)
      b.getTransform<TransformComponent>().setPosition(3, 0, 0)
      update()
      expect(a.component(ColliderComponent).colliding).toBe(false)
    })

    it('draws the colliders', () => {
      // systems must be added before the world is initialized
      world = new GameWorld()
      system = new CollisionSystem()
      const debug = new DebugDrawSystem()
      world.addSystem(new SceneSystem(world))
      world.addSystem(debug)
      world.addSystem(system)
      const scene = world.createEntity({ transform: new TransformComponent(), components: [new SceneComponent()] })
      world.initialize()
      scene.activate()
      create(vec3(0), sphereCollider(1), scene)
      create(vec3(5, 0, 0), boxCollider(vec3(1)), scene)
      // colliders outside of a scene are not drawn
      create(vec3(10, 0, 0), sphereCollider(1))
      const draw = debug.in(scene.$(SceneComponent))
      update()
      expect(draw.vertexCount).toBe(0)
      system.debugDraw = true
      update()
      expect(draw.vertexCount).toBe(3 * debug.segments * 2 + 24)
    })
  })

  describe('filtering', () => {
    it('requires layer and mask on both sides', () => {
      const a = create(vec3(0), sphereCollider(1, { layer: 1, mask: 2 }))
      create(vec3(1.5, 0, 0), sphereCollider(1, { layer: 2, mask: 1 }))
      create(vec3(-1.5, 0, 0), sphereCollider(1, { layer: 2, mask: 2 }))
      create(vec3(0, 1.5, 0), sphereCollider(1, { layer: 4 }))
      const log = record(a)
      update()
      expect(log.length).toBe(1)
    })

    it('ignores the entity hierarchy', () => {
      const parent = world.createEntity({
        transform: new TransformComponent(),
        components: [sphereCollider(1)],
      })
      const child = create(vec3(0.5, 0, 0), sphereCollider(1), parent)
      parent.initialize()
      parent.activate()
      const log = record(child)
      update()
      expect(log.length).toBe(1)
    })
  })

  describe('shapes', () => {
    it('follows the entity transform of a child', () => {
      const parent = world.createEntity({ transform: new TransformComponent({ position: vec3(10, 0, 0) }) })
      create(vec3(0), sphereCollider(1), parent)
      parent.initialize()
      parent.activate()
      const other = create(vec3(11.5, 0, 0), sphereCollider(1))
      const log = record(other)
      update()
      expect(log.length).toBe(1)
    })

    it('respects the box rotation', () => {
      const box = create(vec3(0), boxCollider(vec3(2)))
      const other = create(vec3(2.35, 0, 0), boxCollider(vec3(2)))
      const log = record(other)
      update()
      expect(log.length).toBe(0)
      // rotated by 45° the box reaches sqrt(2) along x
      box.getTransform<TransformComponent>().setRotation(quatCreateAxisAngle(vec3(0, 1, 0), Math.PI / 4))
      update()
      expect(log.length).toBe(1)
    })

    it('respects the entity scale', () => {
      const a = create(vec3(0), sphereCollider(1))
      create(vec3(2.5, 0, 0), sphereCollider(1))
      const log = record(a)
      update()
      expect(log.length).toBe(0)
      a.getTransform<TransformComponent>().setScaleUniform(2)
      update()
      expect(log.length).toBe(1)
    })

    it('respects the shape center', () => {
      const a = create(vec3(0), sphereCollider(1, { center: vec3(1, 0, 0) }))
      create(vec3(2.5, 0, 0), sphereCollider(1))
      const log = record(a)
      update()
      expect(log.length).toBe(1)
    })

    it('mixes shapes', () => {
      const cylinder = create(vec3(0), cylinderCollider(1, 2))
      create(vec3(1.9, 0, 0), sphereCollider(1))
      create(vec3(-1.9, 0, 0), boxCollider(vec3(2)))
      create(vec3(0, 1.9, 0), cylinderCollider(1, 2))
      // beyond the rim, but inside the enclosing box
      create(vec3(1.5, 1.5, 0), sphereCollider(0.6))
      const log = record(cylinder)
      update()
      expect(log.length).toBe(3)
    })
  })

  describe('queries', () => {
    it('raycast returns the closest hit', () => {
      create(vec3(10, 0, 0), sphereCollider(1)).name = 'far'
      create(vec3(5, 0, 0), boxCollider(vec3(2))).name = 'near'
      create(vec3(5, 5, 0), cylinderCollider(1, 2)).name = 'off'
      const hit = system.raycast(rayCreate(vec3(0), vec3(1, 0, 0)))
      expect(hit.entity.name).toBe('near')
      expect(hit.distance).toBeCloseTo(4)
      expect(hit.point.x).toBeCloseTo(4)
    })

    it('raycast respects mask and max distance', () => {
      create(vec3(5, 0, 0), sphereCollider(1, { layer: 2 }))
      create(vec3(10, 0, 0), sphereCollider(1)).name = 'far'
      const ray = rayCreate(vec3(0), vec3(1, 0, 0))
      expect(system.raycast(ray, { mask: 1 }).entity.name).toBe('far')
      expect(system.raycast(ray, { mask: 1, maxDistance: 5 })).toBe(null)
    })

    it('raycast returns 0 when starting inside', () => {
      create(vec3(0), sphereCollider(1))
      expect(system.raycast(rayCreate(vec3(0), vec3(1, 0, 0))).distance).toBe(0)
    })

    it('raycastAll returns all hits sorted', () => {
      create(vec3(10, 0, 0), sphereCollider(1)).name = 'c'
      create(vec3(5, 0, 0), boxCollider(vec3(2))).name = 'b'
      create(vec3(2, 0, 0), cylinderCollider(0.5, 2)).name = 'a'
      create(vec3(0, 5, 0), sphereCollider(1))
      const hits = system.raycastAll(rayCreate(vec3(0), vec3(1, 0, 0)))
      expect(hits.map((it) => it.entity.name)).toEqual(['a', 'b', 'c'])
    })

    it('reuses the out parameters', () => {
      create(vec3(5, 0, 0), sphereCollider(1)).name = 'a'
      create(vec3(10, 0, 0), sphereCollider(1)).name = 'b'
      const ray = rayCreate(vec3(0), vec3(1, 0, 0))

      const hit = system.raycast(ray)
      expect(system.raycast(ray, null, hit)).toBe(hit)

      const hits = system.raycastAll(ray)
      const [first, second] = hits
      expect(system.raycastAll(ray, null, hits)).toBe(hits)
      expect(hits.map((it) => it.entity.name)).toEqual(['a', 'b'])
      expect(hits[0]).toBe(first)
      expect(hits[1]).toBe(second)
      expect(system.raycastAll(ray, { maxDistance: 5 }, hits).length).toBe(1)

      const found = system.overlapPoint(vec3(5, 0, 0))
      expect(system.overlapPoint(vec3(0), null, found)).toBe(found)
      expect(found.length).toBe(0)
    })

    it('can be called from a collision event handler', () => {
      const a = create(vec3(0), sphereCollider(1))
      const b = create(vec3(1.5, 0, 0), sphereCollider(1))
      const c = create(vec3(-1.5, 0, 0), sphereCollider(1))
      b.name = 'b'
      c.name = 'c'
      const log = record(a)
      // a query from the handler must not change the collider list of the running update
      a.events.on(ColliderComponent.onCollisionEnter, () => {
        c.component(ColliderComponent).enabled = false
        system.overlapPoint(vec3(100, 0, 0))
      })
      update()
      expect(log).toEqual(['enter b', 'enter c'])
      update()
      expect(log).toEqual(['enter b', 'enter c', 'exit c'])
    })

    it('overlapPoint and overlapSphere', () => {
      const a = create(vec3(0), sphereCollider(1))
      const b = create(vec3(3, 0, 0), boxCollider(vec3(2)))
      create(vec3(0, 3, 0), cylinderCollider(1, 2, { layer: 2 }))
      expect(system.overlapPoint(vec3(0.5, 0, 0)).map((it) => it.entity)).toEqual([a])
      expect(system.overlapPoint(vec3(0, 3, 0), { mask: 1 })).toEqual([])
      expect(system.overlapSphere(vec3(1.5, 0, 0), 1, { mask: 1 }).map((it) => it.entity)).toEqual([a, b])
      expect(system.overlapSphere(vec3(0, 1.5, 0), 0.6).length).toBe(2)
    })
  })
})
