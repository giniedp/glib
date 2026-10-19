import { GameEntity, GameWorld } from '@gglib/ecs'
import { Device, WebglDevice } from '@gglib/graphics'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { MeshComponent } from '../components/MeshComponent'
import { SceneComponent } from '../components/SceneComponent'
import { SpriteComponent } from '../components/SpriteComponent'
import { TransformComponent } from '../components/TransformComponent'
import { SceneSystem } from './SceneSystem'
import { SpriteSystem } from './SpriteSystem'

describe('SpriteSystem', () => {
  let device: Device
  let world: GameWorld
  let sceneA: GameEntity
  let sceneB: GameEntity

  beforeAll(async () => {
    device = await new WebglDevice({}).ready
  })
  afterAll(() => device.dispose())

  beforeEach(() => {
    world = new GameWorld()
    world.addSystem(new SceneSystem(world))
    world.addSystem(new SpriteSystem(device))
    sceneA = createScene('A')
    sceneB = createScene('B')
    world.initialize()
    sceneA.activate()
    sceneB.activate()
  })

  function createScene(name: string) {
    return world.createEntity({
      name,
      transform: new TransformComponent(),
      components: [new SceneComponent()],
    })
  }

  function createSprite(parent: GameEntity) {
    return world.createEntity({
      parent,
      transform: new TransformComponent(),
      components: [new SpriteComponent()],
    })
  }

  function batchEntities(scene: GameEntity) {
    return (scene.children ?? []).map((it) => it.entity).filter((it) => it.has(MeshComponent))
  }

  it('renders sprites in the scene of their entity', () => {
    createSprite(sceneB)
    world.render(0, 0)
    expect(batchEntities(sceneA).length).toBe(0)
    expect(batchEntities(sceneB).length).toBe(1)
    expect(batchEntities(sceneB)[0].isActive).toBe(true)
  })

  it('batches per scene', () => {
    createSprite(sceneA)
    createSprite(sceneB)
    createSprite(sceneB)
    world.render(0, 0)
    expect(batchEntities(sceneA).length).toBe(1)
    expect(batchEntities(sceneB).length).toBe(1)
  })

  it('ignores sprites outside of a scene', () => {
    const entity = world.createEntity({
      transform: new TransformComponent(),
      components: [new SpriteComponent()],
    })
    entity.initialize()
    entity.activate()
    world.render(0, 0)
    expect(batchEntities(sceneA).length).toBe(0)
    expect(batchEntities(sceneB).length).toBe(0)
  })

  it('drops the batches of a destroyed scene', () => {
    const scene = sceneB.component(SceneComponent)
    const symbols = Object.getOwnPropertySymbols(scene).length
    createSprite(sceneB)
    world.render(0, 0)
    const batch = batchEntities(sceneB)[0]
    expect(Object.getOwnPropertySymbols(scene).length).toBe(symbols + 1)
    sceneB.destroy()
    world.render(0, 0)
    expect(batch.isDestroyed).toBe(true)
    expect(Object.getOwnPropertySymbols(scene).length).toBe(symbols)
  })
})
