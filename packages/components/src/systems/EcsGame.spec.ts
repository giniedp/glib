import { GameSystem } from '@gglib/ecs'
import { describe, expect, it } from 'vitest'
import { BehaviorSystem } from './BehaviorSystem'
import { EcsGame } from './EcsGame'

class CustomSystem extends GameSystem {
  public initialize(): void {
    //
  }
  public destroy(): void {
    //
  }
}

class TestGame extends EcsGame {
  // a field initializer, it runs after the constructor of EcsGame
  public readonly custom = new CustomSystem()
  public added: CustomSystem | null = null
  public behaviorsInOnCreate = true

  protected override onCreate(): void {
    this.world.addSystem(this.custom)
    this.added = this.custom
    this.behaviorsInOnCreate = this.world.hasSystem(BehaviorSystem)
  }
}

function createGame() {
  return new TestGame({ canvas: document.createElement('canvas'), platform: 'webgl2' })
}

describe('EcsGame', () => {
  it('creates no systems in the constructor', () => {
    const game = createGame()
    expect(game.world.hasSystem(BehaviorSystem)).toBe(false)
    expect(game.added).toBe(null)
    game.destroy()
  })

  it('calls onCreate in run, after the fields of the subclass are set', async () => {
    const game = createGame()
    const ready = game.run()
    expect(game.added).toBe(game.custom)
    expect(game.world.getSystem(CustomSystem)).toBe(game.custom)
    await ready
    game.destroy()
  })

  it('adds the missing default systems after onCreate', () => {
    const game = createGame()
    game.run()
    expect(game.behaviorsInOnCreate).toBe(false)
    expect(game.world.hasSystem(BehaviorSystem)).toBe(true)
    expect(game.scene).toBeDefined()
    game.destroy()
  })
})
