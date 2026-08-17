import { GameSystem, GameSystemToken, GameWorld } from '@gglib/ecs'
import { copyKeyboardState, Keyboard, type KeyboardOptions } from '@gglib/game'

/**
 * A component that listens for keyboard events
 *
 * @public
 */
export class KeyboardInputSystem extends Keyboard implements GameSystem {
  public get [GameSystemToken](): boolean {
    return true
  }

  constructor(options: KeyboardOptions = {}) {
    super(options)
  }

  public initialize(world: GameWorld): void {
    //
  }

  public destroy(): void {
    //
  }

  public render(time: number, dt: number): void {
    //
  }
  /**
   * Swaps the `oldState` and `newState` properties and updates the `newState`
   */
  public override update() {
    super.update()
  }
}
