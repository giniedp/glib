import { Entity, OnUpdate, Component } from '@gglib/ecs'
import { Mouse, MouseOptions, MouseState } from '@gglib/input'

/**
 * Constructor options for {@link MouseComponent}
 *
 * @public
 */
export type MouseComponentOptions = MouseOptions

/**
 * A component that listens for mouse events and tracks mouse state
 *
 * @public
 */
@Component()
export class MouseComponent implements OnUpdate {

  /**
   * The component name (`'Mouse'`)
   */
  public readonly name = 'Mouse'

  /**
   * The mouse listener
   */
  public readonly mouse: Mouse

  /**
   * Pressed state in current frame
   *
   * @remarks
   * This is swapped with the `oldState` property each frame
   */
  public newState: MouseState

  /**
   * Pressed state in previous frame
   *
   * @remarks
   * This is swapped with the `newState` property each frame
   */
  public oldState: MouseState

  /**
   * Whether x and y non-normalized client coordinates should be scaled with `window.devicePixelRatio`
   */
  public usePixelRatio: boolean = false
  /**
   * The pixel ratio to use if `usePixelRatio` is `true`
   */
  public customPixelRatio: number = null

  constructor(options: MouseComponentOptions = {}) {
    this.mouse = new Mouse(options)
    this.newState = this.mouse.copyState({})
    this.oldState = this.mouse.copyState({})
  }

  /**
   * Swaps the `oldState` and `newState` properties and updates the `newState`
   */
  public onUpdate() {
    let toUpdate = this.oldState
    this.oldState = this.newState
    this.newState = toUpdate
    this.mouse.copyState(toUpdate)
  }

  /**
   * X position in client coordinates in current frame
   */
  public get x() {
    return this.newState.clientX
  }

  /**
   * Y position in client coordinates in current frame
   */
  public get y() {
    return this.newState.clientY
  }

  /**
   * X position in normalized client coordinates in current frame
   */
  public get xNormalized() {
    return this.newState.normalizedX
  }

  /**
   * Y position in normalized client coordinates in current frame
   */
  public get yNormalized() {
    return this.newState.normalizedY
  }

  /**
   * Movement along x axis in client coordinates since last frame
   */
  public get dx() {
    return this.newState.clientX - this.oldState.clientX
  }

  /**
   * Movement along y axis in client coordinates since last frame
   */
  public get dy() {
    return this.newState.clientY - this.oldState.clientY
  }

  /**
   * Movement along x axis in normalized client coordinates since last frame
   */
  public get dxNormalized() {
    return this.newState.normalizedX - this.oldState.normalizedX
  }

  /**
   * Movement along y axis in normalized client coordinates since last frame
   */
  public get dyNormalized() {
    return this.newState.normalizedY - this.oldState.normalizedY
  }

  /**
   * Wheel value in current frame
   */
  public get wheel() {
    return this.newState.wheel
  }

  /**
   * Wheel movement since last frame
   */
  public get wheelDelta() {
    return this.newState.wheel - this.oldState.wheel
  }

  /**
   * Indicates whether left mouse button is pressed in this frame
   */
  public get leftButtonIsPressed(): boolean {
    return this.newState.buttons[0]
  }

  /**
   * Indicates whether left mouse button is pressed in this frame but was released last frame
   */
  public get leftButtonJustPressed(): boolean {
    return !this.oldState.buttons[0] && this.newState.buttons[0]
  }

  /**
   * Indicates whether left mouse button is released in this frame
   */
  public get leftButtonIsReleased(): boolean {
    return this.newState.buttons[0]
  }

  /**
   * Indicates whether left mouse button is released in this frame but was pressed last frame
   */
  public get leftButtonJustReleased(): boolean {
    return this.oldState.buttons[0] && !this.newState.buttons[0]
  }

  /**
   * Indicates whether middle mouse button is pressed in this frame
   */
  public get middleButtonIsPressed(): boolean {
    return this.newState.buttons[1]
  }

  /**
   * Indicates whether middle mouse button is pressed in this frame but was released last frame
   */
  public get middleButtonJustPressed(): boolean {
    return !this.oldState.buttons[1] && this.newState.buttons[1]
  }

  /**
   * Indicates whether middle mouse button is released in this frame
   */
  public get middleButtonIsReleased(): boolean {
    return this.newState.buttons[1]
  }

  /**
   * Indicates whether middle mouse button is released in this frame but was pressed last frame
   */
  public get middleButtonJustReleased(): boolean {
    return this.oldState.buttons[1] && !this.newState.buttons[1]
  }

  /**
   * Indicates whether right mouse button is pressed in this frame
   */
  public get rightButtonIsPressed(): boolean {
    return this.newState.buttons[2]
  }

  /**
   * Indicates whether right mouse button is pressed in this frame but was released last frame
   */
  public get rightButtonJustPressed(): boolean {
    return !this.oldState.buttons[2] && this.newState.buttons[2]
  }

  /**
   * Indicates whether right mouse button is released in this frame
   */
  public get rightButtonIsReleased(): boolean {
    return this.newState.buttons[2]
  }

  /**
   * Indicates whether right mouse button is released in this frame but was pressed last frame
   */
  public get rightButtonJustReleased(): boolean {
    return this.oldState.buttons[2] && !this.newState.buttons[2]
  }

  /**
   * Indicates whether specific mouse button is pressed in this frame
   */
  public buttonIsPressed(button: number): boolean {
    return this.newState.buttons[button]
  }

  /**
   * Indicates whether specific mouse button is pressed in this frame but was released last frame
   */
  public buttonJustPressed(button: number): boolean {
    return !this.oldState.buttons[button] && this.newState.buttons[button]
  }

  /**
   * Indicates whether specific mouse button is released in this frame
   */
  public buttonIsReleased(button: number): boolean {
    return this.newState.buttons[button]
  }

  /**
   * Indicates whether specific mouse button is released in this frame but was pressed last frame
   */
  public buttonJustReleased(button: number): boolean {
    return this.oldState.buttons[button] && !this.newState.buttons[button]
  }
}
