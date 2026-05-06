import { GameSystem, GameWorld } from '@gglib/ecs'
import { GamepadAxes, GamepadButton, Gamepads } from '@gglib/input'

export class GamePadInput extends GameSystem {
  protected pads: Gamepads

  public constructor() {
    super()
    this.pads = new Gamepads({
      autoUpdate: false,
    })
  }

  override initialize(world: GameWorld): void {
    this.pads.activate()
  }

  override update(): void {
    this.pads.update(true)
  }

  override destroy(): void {
    this.pads.deactivate()
  }

  public buttonPressed(player: number, button: GamepadButton): boolean {
    return this.pads.state[player]?.buttons[button]?.pressed ?? false
  }

  public buttonTouched(player: number, button: GamepadButton): boolean {
    return this.pads.state[player]?.buttons[button]?.touched ?? false
  }

  public buttonValue(player: number, button: GamepadButton): number {
    return this.pads.state[player]?.buttons[button]?.value ?? 0
  }

  public axisValue(player: number, axis: GamepadAxes): number {
    return this.pads.state[player]?.axes[axis] ?? 0
  }
}
