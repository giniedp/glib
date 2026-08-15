import { KeyboardListener } from './KeyboardListener'
import { copyKeyboardState, KeyboardState, KeyboardStateProvider } from './KeyboardState'

export interface KeyboardOptions {
  provider?: KeyboardStateProvider
}

export class Keyboard {
  /**
   * The keyboard listener
   */
  public readonly provider: KeyboardStateProvider

  /**
   * Pressed keys in current frame
   */
  public readonly state: KeyboardState

  /**
   * Pressed keys in last frame
   */
  public readonly statePrev: KeyboardState

  constructor(options: KeyboardOptions = {}) {
    this.provider = options.provider
    if (!this.provider) {
      this.provider = new KeyboardListener()
    }
    this.state = this.provider.getState()
    this.statePrev = this.provider.getState()
  }

  /**
   * Swaps the `oldState` and `newState` properties and updates the `newState`
   */
  public update() {
    copyKeyboardState(this.state, this.statePrev)
    this.provider.getState(this.state)
  }

  /**
   * Detects whether a specific key is currently pressed
   *
   * @param key - The key to check
   */
  public isPressed(key: string): boolean {
    return this.state.pressedCodes.includes(key)
  }

  /**
   * Detects whether a specific key is currently pressed but was released in in last frame
   *
   * @param key - The key to check
   */
  public justPressed(key: string): boolean {
    return this.state.pressedCodes.includes(key) && !this.statePrev.pressedCodes.includes(key)
  }

  /**
   * Detects whether a specific key is currently released
   *
   * @param key - The key to check
   */
  public isReleased(key: string): boolean {
    return !this.state.pressedCodes.includes(key)
  }

  /**
   * Detects whether a specific key is currently released but was pressed in in last frame
   *
   * @param key - The key to check
   */
  public justReleased(key: string): boolean {
    return !this.state.pressedCodes.includes(key) && this.statePrev.pressedCodes.includes(key)
  }
}
