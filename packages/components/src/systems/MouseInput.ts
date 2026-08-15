import { GameSystem, GameSystemToken, GameWorld } from '@gglib/ecs'
import { MouseInput, MouseInputOptions } from '@gglib/game'

/**
 * A component that listens for mouse events and tracks mouse state
 *
 * @public
 */

export class MouseInputSystem extends MouseInput implements GameSystem {
  public get [GameSystemToken]() {
    return true
  }

  public constructor(options: MouseInputOptions = {}) {
    super(options)
  }

  public initialize(world: GameWorld): void {
    //
  }

  public destroy(): void {
    super.dispose()
  }

  public override update() {
    super.update()
  }

  public render(time: number, dt: number): void {
    //
  }
}
