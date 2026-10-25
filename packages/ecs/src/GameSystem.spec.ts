import { describe, expect, it } from 'vitest'
import { GameSystem, SystemOrder } from './GameSystem'
import { GameWorld } from './GameWorld'

class LogSystem extends GameSystem {
  public constructor(
    private log: string[],
    private name: string,
    order: number = SystemOrder.Default,
  ) {
    super()
    this.order = order
  }

  public initialize(): void {
    this.log.push(`init ${this.name}`)
  }

  public destroy(): void {
    //
  }

  public override update(): void {
    this.log.push(this.name)
  }
}

// each system needs its own type to be added to the world
function system(log: string[], name: string, order?: number) {
  const type = class extends LogSystem {}
  Object.defineProperty(type, 'name', { value: name })
  return new type(log, name, order)
}

describe('GameSystem', () => {
  describe('order', () => {
    it('updates by order, not by the time a system was added', () => {
      const log: string[] = []
      const world = new GameWorld()
      world.addSystem(system(log, 'scene', SystemOrder.Scene))
      world.addSystem(system(log, 'input', SystemOrder.Input))
      world.addSystem(system(log, 'logic'))
      world.initialize()
      log.length = 0
      world.update(0, 0)
      expect(log).toEqual(['input', 'logic', 'scene'])
    })

    it('keeps the add order of systems with the same order', () => {
      const log: string[] = []
      const world = new GameWorld()
      world.addSystem(system(log, 'a'))
      world.addSystem(system(log, 'b'))
      world.addSystem(system(log, 'c', SystemOrder.Default + 1))
      world.addSystem(system(log, 'd'))
      world.initialize()
      log.length = 0
      world.update(0, 0)
      expect(log).toEqual(['a', 'b', 'd', 'c'])
    })

    it('initializes in the add order', () => {
      const log: string[] = []
      const world = new GameWorld()
      world.addSystem(system(log, 'late', SystemOrder.Render))
      world.addSystem(system(log, 'early', SystemOrder.Input))
      world.initialize()
      expect(log).toEqual(['init late', 'init early'])
    })

    it('sorts systems that are added after the world was initialized', () => {
      const log: string[] = []
      const world = new GameWorld()
      world.addSystem(system(log, 'input', SystemOrder.Input))
      world.addSystem(system(log, 'render', SystemOrder.Render))
      world.initialize()
      world.addSystem(system(log, 'physics', SystemOrder.Physics))
      log.length = 0
      world.update(0, 0)
      expect(log).toEqual(['input', 'physics', 'render'])
    })
  })
})
