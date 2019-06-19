import { IMouseState, Mouse} from '@gglib/input'
import { extend } from '@gglib/utils'
import { OnAdded, OnRemoved, OnUpdate } from './../Component'
import { Entity } from './../Entity'

/**
 * @public
 */
export class MouseComponent implements OnAdded, OnRemoved, OnUpdate {

  public readonly mouse: Mouse
  public newState: IMouseState
  public oldState: IMouseState

  constructor(options: any= {}) {
    this.mouse = new Mouse({ eventTarget: options.el || document })
    extend(this, options)
    this.newState = this.mouse.copyState({})
    this.oldState = this.mouse.copyState({})
  }

  public onAdded(entity: Entity) {
    entity.addService(MouseComponent, this)
  }

  public onRemoved(entity: Entity) {
    entity.removeService(MouseComponent)
  }

  public onUpdate() {
    let toUpdate = this.oldState
    this.oldState = this.newState
    this.newState = toUpdate
    this.mouse.copyState(toUpdate)
  }

  get x() {
    return this.newState.x
  }

  get y() {
    return this.newState.y
  }

  get xDelta() {
    return this.newState.x - this.oldState.x
  }

  get yDelta() {
    return this.newState.y - this.oldState.y
  }

  get wheel() {
    return this.newState.wheel
  }

  get wheelDelta() {
    return this.newState.wheel - this.oldState.wheel
  }

  get leftButtonIsPressed(): boolean {
    return this.newState.buttons[0]
  }

  get leftButtonJustPressed(): boolean {
    return !this.oldState.buttons[0] && this.newState.buttons[0]
  }

  get leftButtonIsReleased(): boolean {
    return this.newState.buttons[0]
  }

  get leftButtonJustReleased(): boolean {
    return this.oldState.buttons[0] && !this.newState.buttons[0]
  }

  get middleButtonIsPressed(): boolean {
    return this.newState.buttons[1]
  }

  get middleButtonJustPressed(): boolean {
    return !this.oldState.buttons[1] && this.newState.buttons[1]
  }

  get middleButtonIsReleased(): boolean {
    return this.newState.buttons[1]
  }

  get middleButtonJustReleased(): boolean {
    return this.oldState.buttons[1] && !this.newState.buttons[1]
  }

  get rightButtonIsPressed(): boolean {
    return this.newState.buttons[2]
  }

  get rightButtonJustPressed(): boolean {
    return !this.oldState.buttons[2] && this.newState.buttons[2]
  }

  get rightButtonIsReleased(): boolean {
    return this.newState.buttons[2]
  }

  get rightButtonJustReleased(): boolean {
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
