import { IKeyboardState, Keyboard } from '@gglib/input'
import { extend } from '@gglib/utils'
import { Service } from '../decorators'
import { OnUpdate } from './../Component'

/**
 * @public
 */
@Service()
export class KeyboardComponent implements OnUpdate {
  public keyboard: Keyboard
  public newState: IKeyboardState
  public oldState: IKeyboardState

  constructor(options: any= {}) {
    this.keyboard = new Keyboard()
    extend(this, options)
    this.newState = this.keyboard.copyState({})
    this.oldState = this.keyboard.copyState({})
  }

  public onUpdate() {
    const toUpdate = this.oldState
    this.oldState = this.newState
    this.newState = toUpdate
    this.keyboard.copyState(toUpdate)
  }

  public isPressed(key: number): boolean {
    return this.newState.pressedKeys.indexOf(key) >= 0
  }

  public justPressed(key: number): boolean {
    return (this.oldState.pressedKeys.indexOf(key) < 0) && (this.newState.pressedKeys.indexOf(key) >= 0)
  }

  public isReleased(key: number): boolean {
    return (this.newState.pressedKeys.indexOf(key) >= 0)
  }

  public justReleased(key: number): boolean {
    return (this.oldState.pressedKeys.indexOf(key) >= 0) && (this.newState.pressedKeys.indexOf(key) < 0)
  }
}
