import { GameSystem, GameProvider } from '@gglib/ecs'
import { KeyboardKey, KeyboardListener, KeyboardOptions } from '@gglib/input'
import { GameLoop } from './GameLoop'

/**
 * A component that listens for keyboard events
 *
 * @public
 */
export class KeyboardInput implements GameSystem {
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
  public newState = new Set<KeyboardKey>()

  /**
   * Pressed keys in last frame
   *
   * @remarks
   * This is swapped with the `newState` property each frame
   */
  public oldState = new Set<KeyboardKey>()

  private addToNewState = (k: KeyboardKey) => this.newState.add(k)
  private loop: GameLoop
  constructor(options: KeyboardOptions = {}) {
    this.listener = new KeyboardListener(options)
  }

  public initialize(host: GameProvider): void {
    this.loop = host.get(GameLoop)
    this.loop.onUpdate.add(this.onUpdate)
  }

  public destroy(): void {
    this.loop.onUpdate.remove(this.onUpdate)
  }

  /**
   * Swaps the `oldState` and `newState` properties and updates the `newState`
   */
  public onUpdate = () => {
    ;[this.oldState, this.newState] = [this.newState, this.oldState]
    this.newState.clear()
    this.listener.keys.forEach(this.addToNewState)
  }

  /**
   * Detects whether a specific key is currently pressed
   *
   * @param key - The key to check
   */
  public isPressed(key: KeyboardKey): boolean {
    return this.newState.has(key)
  }

  /**
   * Detects whether a specific key is currently pressed but was released in in last frame
   *
   * @param key - The key to check
   */
  public justPressed(key: KeyboardKey): boolean {
    return this.oldState.has(key) && this.newState.has(key)
  }

  /**
   * Detects whether a specific key is currently released
   *
   * @param key - The key to check
   */
  public isReleased(key: KeyboardKey): boolean {
    return this.newState.has(key)
  }

  /**
   * Detects whether a specific key is currently released but was pressed in in last frame
   *
   * @param key - The key to check
   */
  public justReleased(key: KeyboardKey): boolean {
    return this.oldState.has(key) && !this.newState.has(key)
  }
}
