import { Component, forwardRef, Inject } from './decorators'
import { Entity } from './Entity'

fdescribe('@gglib/ecs/Entity', () => {

  describe('#install', () => {
    @Component()
    class ComponentA {

    }

    @Component({
      install: [ComponentA]
    })
    class ComponentB {
      @Inject(ComponentA)
      public injected: ComponentA
    }

    @Component({
      install: [forwardRef(() => ComponentA)]
    })
    class ComponentC {
      @Inject(forwardRef(() => ComponentA))
      public injected: ComponentA
    }

    let root: Entity
    beforeEach(() => {
      root = Entity.createRoot()
    })

    it('installs components by type', () => {
      expect(root.has(ComponentA)).toBe(false)
      root.install(ComponentA)
      expect(root.has(ComponentA)).toBe(true)
      expect(root.get(ComponentA)).toBeInstanceOf(ComponentA)
    })

    it('installs components only once', () => {
      root.install(ComponentA)
      root.install(ComponentA)
      root.install(ComponentA)
      expect(root.getMulti(ComponentA).length).toBe(1)
    })

    it ('installs dependencies', () => {
      root.install(ComponentB)
      expect(root.has(ComponentA)).toBe(true)
      expect(root.get(ComponentA)).toBeInstanceOf(ComponentA)

      expect(root.get(ComponentB).injected).toBeUndefined()
      root.initializeComponents()
      expect(root.get(ComponentB).injected).toBeInstanceOf(ComponentA)
    })

    it ('installs forwardRef dependencies', () => {
      root.install(ComponentC)
      expect(root.has(ComponentA)).toBe(true)
      expect(root.get(ComponentA)).toBeInstanceOf(ComponentA)

      expect(root.get(ComponentC).injected).toBeUndefined()
      root.initializeComponents()
      expect(root.get(ComponentC).injected).toBeInstanceOf(ComponentA)
    })
  })
})
