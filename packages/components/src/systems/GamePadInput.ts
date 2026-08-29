import { GameSystem, GameWorld, IsGameSystem } from '@gglib/ecs'
import { Gamepad } from '@gglib/game'

export class GamePadInput extends Gamepad implements GameSystem {
  public get [IsGameSystem]() {
    return true
  }

  public constructor() {
    super()
  }

  public initialize(world: GameWorld): void {
    //
  }

  public destroy(): void {
    this.dispose()
  }

  override update(): void {
    super.update()
  }

  public render(time: number, dt: number): void {
    //
  }
}
