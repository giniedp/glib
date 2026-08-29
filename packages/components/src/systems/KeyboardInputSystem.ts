import { GameSystem, IsGameSystem, GameWorld } from '@gglib/ecs'
import { copyKeyboardState, Keyboard, type KeyboardOptions } from '@gglib/game'

/**
 * A component that listens for keyboard events
 *
 * @public
 */
export class KeyboardInputSystem extends Keyboard implements GameSystem {
  public get [IsGameSystem](): boolean {
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

  public override update() {
    super.update()
  }

  public render(time: number, dt: number): void {
    //
  }
}
