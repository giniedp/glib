import { isWorkerContext } from '@gglib/utils'
import { MouseListener } from './MouseListener'
import { MouseButton, MouseState, MouseStateProvider } from './MouseState'
import { MouseStateTransfer } from './MouseStateTransfer'

export interface MouseInputOptions {
  provider?: MouseStateProvider
}

export class MouseInput {
  /**
   * The mouse listener
   */
  public readonly provider: MouseStateProvider

  /**
   * Pressed state in current frame
   *
   * @remarks
   * This is swapped with the `oldState` property each frame
   */
  public state: MouseState

  /**
   * Pressed state in previous frame
   *
   * @remarks
   * This is swapped with the `newState` property each frame
   */
  public statePrev: MouseState

  constructor(options: MouseInputOptions = {}) {
    this.provider = options.provider
    if (!this.provider) {
      if (isWorkerContext) {
        this.provider = new MouseStateTransfer({ type: 'receiver' })
      } else {
        this.provider = new MouseListener({})
      }
    }
    this.state = this.provider.getState({})
    this.statePrev = this.provider.getState({})
  }

  /**
   * Updates the mouse state
   */
  public update() {
    Object.assign(this.statePrev, this.state)
    this.provider.getState(this.state)
  }

  /**
   * X position in client coordinates in current frame
   */
  public get x() {
    return this.state.x
  }

  /**
   * Y position in client coordinates in current frame
   */
  public get y() {
    return this.state.y
  }

  /**
   * X position in normalized client coordinates in current frame
   */
  public get xNormalized() {
    return this.state.xNormalized
  }

  /**
   * Y position in normalized client coordinates in current frame
   */
  public get yNormalized() {
    return this.state.yNormalized
  }

  /**
   * Movement along x axis in client coordinates since last frame
   */
  public get dx() {
    return this.state.x - this.statePrev.x
  }

  /**
   * Movement along y axis in client coordinates since last frame
   */
  public get dy() {
    return this.state.y - this.statePrev.y
  }

  /**
   * Movement along x axis in normalized client coordinates since last frame
   */
  public get dxNormalized() {
    return this.state.xNormalized - this.statePrev.xNormalized
  }

  /**
   * Movement along y axis in normalized client coordinates since last frame
   */
  public get dyNormalized() {
    return this.state.yNormalized - this.statePrev.yNormalized
  }

  /**
   * Wheel value in current frame
   */
  public get wheel() {
    return this.state.wheel
  }

  /**
   * Wheel movement since last frame
   */
  public get wheelDelta() {
    return this.state.wheel - this.statePrev.wheel
  }

  /**
   * Indicates whether left mouse button is pressed in this frame
   */
  public get leftButtonIsPressed(): boolean {
    return this.buttonIsPressed(MouseButton.Left)
  }

  /**
   * Indicates whether left mouse button is pressed in this frame but was released last frame
   */
  public get leftButtonJustPressed(): boolean {
    return this.buttonJustPressed(MouseButton.Left)
  }

  /**
   * Indicates whether left mouse button is released in this frame
   */
  public get leftButtonIsReleased(): boolean {
    return this.buttonIsReleased(MouseButton.Left)
  }

  /**
   * Indicates whether left mouse button is released in this frame but was pressed last frame
   */
  public get leftButtonJustReleased(): boolean {
    return this.buttonJustPressed(MouseButton.Left)
  }

  /**
   * Indicates whether middle mouse button is pressed in this frame
   */
  public get middleButtonIsPressed(): boolean {
    return this.buttonIsPressed(MouseButton.Middle)
  }

  /**
   * Indicates whether middle mouse button is pressed in this frame but was released last frame
   */
  public get middleButtonJustPressed(): boolean {
    return this.buttonJustPressed(MouseButton.Middle)
  }

  /**
   * Indicates whether middle mouse button is released in this frame
   */
  public get middleButtonIsReleased(): boolean {
    return this.buttonIsReleased(MouseButton.Middle)
  }

  /**
   * Indicates whether middle mouse button is released in this frame but was pressed last frame
   */
  public get middleButtonJustReleased(): boolean {
    return this.buttonJustReleased(MouseButton.Middle)
  }

  /**
   * Indicates whether right mouse button is pressed in this frame
   */
  public get rightButtonIsPressed(): boolean {
    return this.buttonIsPressed(MouseButton.Right)
  }

  /**
   * Indicates whether right mouse button is pressed in this frame but was released last frame
   */
  public get rightButtonJustPressed(): boolean {
    return this.buttonJustPressed(MouseButton.Right)
  }

  /**
   * Indicates whether right mouse button is released in this frame
   */
  public get rightButtonIsReleased(): boolean {
    return this.buttonIsReleased(MouseButton.Right)
  }

  /**
   * Indicates whether right mouse button is released in this frame but was pressed last frame
   */
  public get rightButtonJustReleased(): boolean {
    return this.buttonJustReleased(MouseButton.Right)
  }

  /**
   * Indicates whether specific mouse button is pressed in this frame
   */
  public buttonIsPressed(button: MouseButton): boolean {
    return !!(this.state.buttons & button)
  }

  /**
   * Indicates whether specific mouse button is pressed in this frame but was released last frame
   */
  public buttonJustPressed(button: MouseButton): boolean {
    return !(this.statePrev.buttons & button) && !!(this.state.buttons && button)
  }

  /**
   * Indicates whether specific mouse button is released in this frame
   */
  public buttonIsReleased(button: MouseButton): boolean {
    return !(this.state.buttons & button)
  }

  /**
   * Indicates whether specific mouse button is released in this frame but was pressed last frame
   */
  public buttonJustReleased(button: MouseButton): boolean {
    return !!(this.statePrev.buttons & button) && !(this.state.buttons & button)
  }

  /**
   * Calls {@link MouseListener.dispose} on the internal listener instance
   */
  public dispose() {
    this.provider.dispose()
  }
}
