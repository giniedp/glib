import { GameWorld } from '@gglib/ecs'
import { beforeEach, describe, expect, it } from 'vitest'
import { SceneComponent } from '../components/SceneComponent'
import { TransformComponent } from '../components/TransformComponent'
import { SceneSystem } from './SceneSystem'

describe('SceneSystem', () => {
  let world: GameWorld

  beforeEach(() => {
    world = new GameWorld()
    world.addSystem(new SceneSystem(world))
    world.initialize()
  })

  function createScene() {
    const entity = world.createEntity({
      transform: new TransformComponent(),
      components: [new SceneComponent()],
    })
    entity.initialize()
    entity.activate()
    return entity.$(SceneComponent)
  }

  function createChild(scene: SceneComponent) {
    return world.createEntity({ parent: scene.entity, transform: new TransformComponent() })
  }

  it('tags the members of each scene with that scene only', () => {
    // the shared alias gets its id with the first member, before the second scene creates its tag type
    const a = createScene()
    const inA = createChild(a)
    const b = createScene()
    const inB = createChild(b)

    const membersA = world.query({ scope: 'active', required: [a.Member] })
    const membersB = world.query({ scope: 'active', required: [b.Member] })
    const all = world.query({ scope: 'active', required: [SceneComponent.Member] })

    expect([...membersA]).toContain(inA)
    expect([...membersA]).not.toContain(inB)
    expect([...membersB]).toContain(inB)
    expect([...membersB]).not.toContain(inA)
    expect([...all]).toEqual(expect.arrayContaining([inA, inB]))
  })
})
