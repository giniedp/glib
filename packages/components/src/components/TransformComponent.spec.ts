import { GameEntity, GameEntityState, GameWorld } from '@gglib/ecs'
import { beforeEach, describe, expect, it } from 'vitest'
import { LifeCycleFlags, TransformComponent } from './TransformComponent'

describe('@gglib/ecs/TransformComponent', () => {
  let world: GameWorld

  beforeEach(() => {
    world = new GameWorld()
  })

  describe('auto cycle', () => {
    it('should propagate state change', () => {
      const root = world.createEntity({
        name: 'root',
        transform: new TransformComponent(),
      })
      const parent = world.createEntity({
        name: 'parent',
        parent: root,
        transform: new TransformComponent(),
      })
      const child = world.createEntity({
        name: 'child',
        parent: parent,
        transform: new TransformComponent(),
      })

      expect(root.state).toBe(GameEntityState.Created)
      expect(parent.state).toBe(GameEntityState.Created)
      expect(child.state).toBe(GameEntityState.Created)

      root.initialize()

      expect(root.state).toBe(GameEntityState.Initialized)
      expect(parent.state).toBe(GameEntityState.Initialized)
      expect(child.state).toBe(GameEntityState.Initialized)

      root.activate()

      expect(root.state).toBe(GameEntityState.Activated)
      expect(parent.state).toBe(GameEntityState.Activated)
      expect(child.state).toBe(GameEntityState.Activated)

      root.deactivate()

      expect(root.state).toBe(GameEntityState.Initialized)
      expect(parent.state).toBe(GameEntityState.Initialized)
      expect(child.state).toBe(GameEntityState.Initialized)

      root.destroy()

      expect(root.state).toBe(GameEntityState.Destroyed)
      expect(parent.state).toBe(GameEntityState.Destroyed)
      expect(child.state).toBe(GameEntityState.Destroyed)
    })

    describe('when parent changes', () => {
      let root1: GameEntity
      let root2: GameEntity
      let parent: GameEntity
      let child: GameEntity

      beforeEach(() => {
        root1 = world.createEntity({
          name: 'root1',
          transform: new TransformComponent(),
        })
        root2 = world.createEntity({
          name: 'root2',
          transform: new TransformComponent(),
        })
        parent = world.createEntity({
          name: 'parent',
          parent: null,
          transform: new TransformComponent(),
        })
        child = world.createEntity({
          name: 'child',
          parent: parent,
          transform: new TransformComponent(),
        })

        expect(root1.state).toBe(GameEntityState.Created)
        expect(root2.state).toBe(GameEntityState.Created)
        expect(parent.state).toBe(GameEntityState.Created)
        expect(child.state).toBe(GameEntityState.Created)

        root1.initialize()
        root2.initialize()
        root2.activate()

        expect(root1.state).toBe(GameEntityState.Initialized)
        expect(root2.state).toBe(GameEntityState.Activated)
        expect(parent.state).toBe(GameEntityState.Created)
        expect(child.state).toBe(GameEntityState.Created)
      })

      it('should initialize tree when new parent is initialized', () => {
        parent.getTransform<TransformComponent>()!.setParent(root1.getTransform<TransformComponent>()!)
        expect(root1.state).toBe(GameEntityState.Initialized)
        expect(parent.state).toBe(GameEntityState.Initialized)
        expect(child.state).toBe(GameEntityState.Initialized)
      })

      it('should activate tree when new parent is active', () => {
        parent.getTransform<TransformComponent>()!.setParent(root2.getTransform<TransformComponent>()!)
        expect(root1.state).toBe(GameEntityState.Initialized)
        expect(root2.state).toBe(GameEntityState.Activated)
        expect(parent.state).toBe(GameEntityState.Activated)
        expect(child.state).toBe(GameEntityState.Activated)
      })

      it('should keep tree state when detached', () => {
        parent.getTransform<TransformComponent>()!.setParent(root2.getTransform<TransformComponent>()!)
        expect(parent.state).toBe(GameEntityState.Activated)
        expect(child.state).toBe(GameEntityState.Activated)
        parent.getTransform<TransformComponent>()!.setParent(null)
        expect(parent.state).toBe(GameEntityState.Activated)
        expect(child.state).toBe(GameEntityState.Activated)
      })

      it('is deactivated when was active but new parent is not', () => {
        parent.getTransform<TransformComponent>()!.setParent(root2.getTransform<TransformComponent>()!)
        expect(parent.state).toBe(GameEntityState.Activated)
        expect(child.state).toBe(GameEntityState.Activated)
        parent.getTransform<TransformComponent>()!.setParent(root1.getTransform<TransformComponent>()!)
        expect(parent.state).toBe(GameEntityState.Initialized)
        expect(child.state).toBe(GameEntityState.Initialized)
      })
    })

    describe('opt out of auto cycle', () => {
      it('should not propagate state change', () => {
        const root = world.createEntity({
          name: 'root',
          transform: new TransformComponent({ lifeCycle: LifeCycleFlags.Propagate }),
        })
        const parent = world.createEntity({
          name: 'parent',
          parent: root,
          transform: new TransformComponent({ lifeCycle: LifeCycleFlags.Receive }),
        })
        const child = world.createEntity({
          name: 'child',
          parent: parent,
          transform: new TransformComponent({ lifeCycle: LifeCycleFlags.None }),
        })

        expect(root.state).toBe(GameEntityState.Created)
        expect(parent.state).toBe(GameEntityState.Created)
        expect(child.state).toBe(GameEntityState.Created)

        root.initialize()

        expect(root.state).toBe(GameEntityState.Initialized)
        expect(parent.state).toBe(GameEntityState.Initialized)
        expect(child.state).toBe(GameEntityState.Created)
      })
    })
  })
})
