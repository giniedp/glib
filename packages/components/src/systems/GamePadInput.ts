import { GameSystem, GameSystemToken, GameWorld } from '@gglib/ecs'
import { Gamepad } from '@gglib/game'

export class GamePadInput extends Gamepad implements GameSystem {
  public get [GameSystemToken]() {
    return true
  }

  public constructor() {
    super()
  }

  public initialize(world: GameWorld): void {
    //
  }

  override update(): void {
    super.update()
  }

  public render(time: number, dt: number): void {
    //
  }

  public destroy(): void {
    this.dispose()
  }
}
