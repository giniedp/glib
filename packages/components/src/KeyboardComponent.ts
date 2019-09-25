import { Entity, OnUpdate, Service } from '@gglib/ecs'
import { Keyboard, KeyboardKey, KeyboardOptions } from '@gglib/input'

/**
 * A component that listens for keyboard events
 *
 * @public
 */
@Service()
export class KeyboardComponent implements OnUpdate {
  /**
   * Adds a {@link KeyboardComponent} to the entity if it does not exist
   *
   * @param entity - The entity
   */
  public static ensure(entity: Entity) {
    if (entity.getService(KeyboardComponent, null) == null) {
      entity.addComponent(new KeyboardComponent())
    }
  }

  /**
   * The component name (`'Keyboard'`)
   */
  public readonly name = 'Keyboard'

  /**
   * The keyboard listener
   */
  public readonly keyboard: Keyboard

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

  constructor(options: KeyboardOptions = {}) {
    this.keyboard = new Keyboard(options)
  }

  /**
   * Swaps the `oldState` and `newState` properties and updates the `newState`
   */
  public onUpdate() {
    [this.oldState, this.newState] = [this.newState, this.oldState]
    this.newState.clear()
    this.keyboard.keys.forEach(this.addToNewState)
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
