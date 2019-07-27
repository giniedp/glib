import { IMouseOptions, IMouseState, Mouse } from '@gglib/input'
import { Service } from '../decorators'
import { OnUpdate } from './../Component'

/**
 * Constructor options for {@link MouseComponent}
 *
 * @public
 */
export type MouseComponentOptions = IMouseOptions

/**
 * @public
 */
@Service()
export class MouseComponent implements OnUpdate {

  public readonly name = 'Mouse'

  public readonly mouse: Mouse
  public newState: IMouseState
  public oldState: IMouseState

  constructor(options: MouseComponentOptions = {}) {
    this.mouse = new Mouse(options)
    this.newState = this.mouse.copyState({})
    this.oldState = this.mouse.copyState({})
  }

  public onUpdate() {
    let toUpdate = this.oldState
    this.oldState = this.newState
    this.newState = toUpdate
    this.mouse.copyState(toUpdate)
  }

  public get x() {
    return this.newState.x
  }

  public get y() {
    return this.newState.y
  }

  public get xDelta() {
    return this.newState.x - this.oldState.x
  }

  public get yDelta() {
    return this.newState.y - this.oldState.y
  }

  public get wheel() {
    return this.newState.wheel
  }

  public get wheelDelta() {
    return this.newState.wheel - this.oldState.wheel
  }

  public get leftButtonIsPressed(): boolean {
    return this.newState.buttons[0]
  }

  public get leftButtonJustPressed(): boolean {
    return !this.oldState.buttons[0] && this.newState.buttons[0]
  }

  public get leftButtonIsReleased(): boolean {
    return this.newState.buttons[0]
  }

  public get leftButtonJustReleased(): boolean {
    return this.oldState.buttons[0] && !this.newState.buttons[0]
  }

  public get middleButtonIsPressed(): boolean {
    return this.newState.buttons[1]
  }

  public get middleButtonJustPressed(): boolean {
    return !this.oldState.buttons[1] && this.newState.buttons[1]
  }

  public get middleButtonIsReleased(): boolean {
    return this.newState.buttons[1]
  }

  public get middleButtonJustReleased(): boolean {
    return this.oldState.buttons[1] && !this.newState.buttons[1]
  }

  public get rightButtonIsPressed(): boolean {
    return this.newState.buttons[2]
  }

  public get rightButtonJustPressed(): boolean {
    return !this.oldState.buttons[2] && this.newState.buttons[2]
  }

  public get rightButtonIsReleased(): boolean {
    return this.newState.buttons[2]
  }

  public get rightButtonJustReleased(): boolean {
    return this.oldState.buttons[2] && !this.newState.buttons[2]
  }

  public buttonIsPressed(button: number): boolean {
    return this.newState.buttons[button]
  }

  public buttonJustPressed(button: number): boolean {
    return !this.oldState.buttons[button] && this.newState.buttons[button]
  }

  public buttonIsReleased(button: number): boolean {
    return this.newState.buttons[button]
  }

  public buttonJustReleased(button: number): boolean {
    return this.oldState.buttons[button] && !this.newState.buttons[button]
  }
}
