import { GamepadListener } from './GamepadListener'
import { copyGamepadState, GamepadState, GamepadStateProvider } from './GamepadState'
import { GamepadAxes, GamepadButton } from './types'

export interface GamepadOptions {
  provider?: GamepadStateProvider
}

export class Gamepad {
  /**
   * The keyboard listener
   */
  public readonly provider: GamepadStateProvider

  /**
   * Pressed keys in current frame
   */
  public readonly state: Record<number, GamepadState>

  /**
   * Pressed keys in last frame
   */
  public readonly statePrev: Record<number, GamepadState>

  constructor(options: GamepadOptions = {}) {
    this.provider = options.provider
    if (!this.provider) {
      this.provider = new GamepadListener()
    }
    this.state = this.provider.getState()
    this.statePrev = this.provider.getState()
  }

  /**
   * Swaps the `oldState` and `newState` properties and updates the `newState`
   */
  public update() {
    copyGamepadState(this.state, this.statePrev)
    this.provider.getState(this.state)
  }

  public axesValue(player: number, axes: GamepadAxes): number {
    return this.state[player]?.axes?.[axes] ?? 0
  }

  public axesDelta(player: number, axes: GamepadAxes): number {
    return (this.state[player]?.axes?.[axes] ?? 0) - (this.statePrev[player]?.axes?.[axes] ?? 0)
  }

  public buttonValue(player: number, axes: GamepadButton): number {
    return this.state[player]?.buttons?.[axes] ?? 0
  }

  public buttonDelta(player: number, btn: GamepadButton): number {
    return (this.state[player]?.buttons?.[btn] ?? 0) - (this.statePrev[player]?.buttons?.[btn] ?? 0)
  }

  public isConnected(player: number): boolean {
    return !!this.state[player]?.connected
  }

  /**
   * Detects whether a specific key is currently pressed
   *
   * @param btn - The key to check
   */
  public isPressed(index: number, btn: GamepadButton): boolean {
    return !!this.buttonValue(index, btn)
  }

  /**
   * Detects whether a specific key is currently pressed but was released in in last frame
   *
   * @param btn - The key to check
   */
  public justPressed(index: number, btn: GamepadButton): boolean {
    return this.buttonDelta(index, btn) > 0
  }

  /**
   * Detects whether a specific key is currently released
   *
   * @param key - The key to check
   */
  public isReleased(index: number, key: GamepadButton): boolean {
    return !this.buttonValue(index, key)
  }

  /**
   * Detects whether a specific key is currently released but was pressed in in last frame
   *
   * @param btn - The key to check
   */
  public justReleased(index: number, btn: GamepadButton): boolean {
    return this.buttonDelta(index, btn) < 0
  }

  public dispose() {
    this.provider.dispose()
  }
}
