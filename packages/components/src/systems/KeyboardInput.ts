import { GameSystem, GameWorld } from '@gglib/ecs'
import { copyKeyboardState, KeyboardListener, KeyboardState, type KeyboardOptions } from '@gglib/game'

/**
 * A component that listens for keyboard events
 *
 * @public
 */
export class KeyboardInputSystem extends GameSystem {
  /**
   * The keyboard listener
   */
  public listener: KeyboardListener

  /**
   * Pressed keys in current frame
   *
   * @remarks
   * This is swapped with the `oldState` property each frame
   */
  public newState: KeyboardState

  /**
   * Pressed keys in last frame
   *
   * @remarks
   * This is swapped with the `newState` property each frame
   */
  public oldState: KeyboardState

  constructor(options: KeyboardOptions = {}) {
    super()
    this.listener = new KeyboardListener()
    this.newState = this.listener.getState()
    this.oldState = this.listener.getState()
  }

  public initialize(world: GameWorld): void {
    //
  }

  public destroy(): void {
    //
  }

  /**
   * Swaps the `oldState` and `newState` properties and updates the `newState`
   */
  public override update() {
    copyKeyboardState(this.newState, this.oldState)
    this.listener.getState(this.newState)
  }

  /**
   * Detects whether a specific key is currently pressed
   *
   * @param key - The key to check
   */
  public isPressed(key: string): boolean {
    return this.newState.pressedKeys.includes(key)
  }

  /**
   * Detects whether a specific key is currently pressed but was released in in last frame
   *
   * @param key - The key to check
   */
  public justPressed(key: string): boolean {
    return !this.oldState.pressedKeys.includes(key) && this.newState.pressedKeys.includes(key)
  }

  /**
   * Detects whether a specific key is currently released
   *
   * @param key - The key to check
   */
  public isReleased(key: string): boolean {
    return this.newState.pressedKeys.includes(key)
  }

  /**
   * Detects whether a specific key is currently released but was pressed in in last frame
   *
   * @param key - The key to check
   */
  public justReleased(key: string): boolean {
    return this.oldState.pressedKeys.includes(key) && !this.newState.pressedKeys.includes(key)
  }
}
