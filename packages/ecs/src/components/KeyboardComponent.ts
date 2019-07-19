import { IKeyboardOptions, Keyboard, KeyboardKey } from '@gglib/input'
import { Service } from '../decorators'
import { OnUpdate } from './../Component'

/**
 * @public
 */
@Service()
export class KeyboardComponent implements OnUpdate {
  public readonly name = 'Keyboard'

  /**
   * The keyboard helper class
   */
  public readonly keyboard: Keyboard

  /**
   * Pressed keys in current frame
   */
  public newState = new Set<KeyboardKey>()

  /**
   * Pressed keys in last frame
   */
  public oldState = new Set<KeyboardKey>()

  private addToNewState = (k: KeyboardKey) => this.newState.add(k)

  constructor(options: IKeyboardOptions= {}) {
    this.keyboard = new Keyboard(options)
  }

  public onUpdate() {
    [this.oldState, this.newState] = [this.newState, this.oldState]
    this.newState.clear()
    this.keyboard.keys.forEach(this.addToNewState)
  }

  public isPressed(key: KeyboardKey): boolean {
    return this.newState.has(key)
  }

  public justPressed(key: KeyboardKey): boolean {
    return this.oldState.has(key) && this.newState.has(key)
  }

  public isReleased(key: KeyboardKey): boolean {
    return (this.newState.has(key))
  }

  public justReleased(key: KeyboardKey): boolean {
    return this.oldState.has(key) && !this.newState.has(key)
  }
}
