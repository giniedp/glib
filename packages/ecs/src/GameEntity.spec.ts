import { beforeEach, describe, expect, it } from 'vitest'
import type { GameComponent } from './GameComponent'
import { GameEntity } from './GameEntity'
import { GameEntityState } from './GameEntityState'
import { GameWorld } from './GameWorld'

class TestComponent implements GameComponent {
  public entity: GameEntity
  public isInitialized = false
  public isActivated = false
  public isDestroyed = false

  initialize(): void {
    this.isInitialized = true
  }
  activate(): void {
    this.isActivated = true
  }
  deactivate(): void {
    this.isActivated = false
  }
  destroy(): void {
    this.isDestroyed = true
  }
}

describe('GameEntity', () => {
  let world: GameWorld

  beforeEach(() => {
    world = new GameWorld()
  })

  describe('lifecycle', () => {
    describe('when created', () => {
      it('is not initialized', () => {
        const entity = world.createEntity()
        expect(entity.state).toBe(GameEntityState.Created)
        expect(entity.isInitialized).toBe(false)
        expect(entity.isActive).toBe(false)
        expect(entity.isDestroyed).toBe(false)
      })
      it('does not initialize components', () => {
        const entity = world.createEntity()
        const component = new TestComponent()
        entity.addComponent(component)
        expect(component.entity).toBe(entity)
        expect(component.isInitialized).toBe(false)
        expect(component.isActivated).toBe(false)
        expect(component.isDestroyed).toBe(false)
      })
      it('throws if tried to activate', () => {
        const entity = world.createEntity()
        expect(() => entity.activate()).toThrow(/Expected.*to be in Initialized/)
      })
      it('throws if tried to deactivate', () => {
        const entity = world.createEntity()
        expect(() => entity.deactivate()).toThrow(/Expected.*to be in Activated/)
      })
      it('can be destroyed', () => {
        const entity = world.createEntity()
        entity.destroy()
        expect(entity.state).toBe(GameEntityState.Destroyed)
        expect(entity.isInitialized).toBe(false)
        expect(entity.isActive).toBe(false)
        expect(entity.isDestroyed).toBe(true)
      })
    })

    describe('initialize', () => {
      it('is initialized', () => {
        const entity = world.createEntity()
        entity.initialize()
        expect(entity.state).toBe(GameEntityState.Initialized)
        expect(entity.isInitialized).toBe(true)
        expect(entity.isActive).toBe(false)
        expect(entity.isDestroyed).toBe(false)
      })
      it('initializes components', () => {
        const entity = world.createEntity()
        const component = new TestComponent()
        entity.addComponent(component)
        entity.initialize()
        expect(component.entity).toBe(entity)
        expect(component.isInitialized).toBe(true)
        expect(component.isActivated).toBe(false)
        expect(component.isDestroyed).toBe(false)
      })
      it('throws if already initialized', () => {
        const entity = world.createEntity()
        entity.initialize()
        expect(() => entity.initialize()).toThrow(/must have state Created/)
      })
      it('throws if tried to deactivate', () => {
        const entity = world.createEntity()
        entity.initialize()
        expect(() => entity.deactivate()).toThrow(/expected.*to be in Activated/i)
      })
      it('can be destroyed', () => {
        const entity = world.createEntity()
        entity.initialize()
        entity.destroy()
        expect(entity.state).toBe(GameEntityState.Destroyed)
        expect(entity.isInitialized).toBe(false)
        expect(entity.isActive).toBe(false)
        expect(entity.isDestroyed).toBe(true)
      })
    })

    describe('activate', () => {
      it('is activated', () => {
        const entity = world.createEntity()
        entity.initialize()
        entity.activate()
        expect(entity.state).toBe(GameEntityState.Activated)
        expect(entity.isInitialized).toBe(true)
        expect(entity.isActive).toBe(true)
        expect(entity.isDestroyed).toBe(false)
      })
      it('activates components', () => {
        const entity = world.createEntity()
        const component = new TestComponent()
        entity.addComponent(component)
        entity.initialize()
        entity.activate()
        expect(component.entity).toBe(entity)
        expect(component.isInitialized).toBe(true)
        expect(component.isActivated).toBe(true)
        expect(component.isDestroyed).toBe(false)
      })
      it('throws if already activated', () => {
        const entity = world.createEntity()
        entity.initialize()
        entity.activate()
        expect(() => entity.activate()).toThrow(/expected.*to be in initialized/i)
      })
      it('can be deactivated', () => {
        const entity = world.createEntity()
        entity.initialize()
        entity.activate()
        entity.deactivate()
        expect(entity.state).toBe(GameEntityState.Initialized)
        expect(entity.isInitialized).toBe(true)
        expect(entity.isActive).toBe(false)
        expect(entity.isDestroyed).toBe(false)
      })
      it('can be re-activated', () => {
        const entity = world.createEntity()
        entity.initialize()
        entity.activate()
        entity.deactivate()
        entity.activate()
        expect(entity.state).toBe(GameEntityState.Activated)
        expect(entity.isInitialized).toBe(true)
        expect(entity.isActive).toBe(true)
        expect(entity.isDestroyed).toBe(false)
      })
      it('can be destroyed', () => {
        const entity = world.createEntity()
        entity.initialize()
        entity.activate()
        entity.destroy()
        expect(entity.state).toBe(GameEntityState.Destroyed)
        expect(entity.isInitialized).toBe(false)
        expect(entity.isActive).toBe(false)
        expect(entity.isDestroyed).toBe(true)
      })
    })
  })
})
