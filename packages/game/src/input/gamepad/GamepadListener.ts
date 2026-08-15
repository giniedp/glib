import { copyGamepadState, GamepadState, GamepadStateProvider } from './GamepadState'

/**
 * A wrapper class around the
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API | Gamepad API}
 *
 * @public
 */
export class GamepadListener implements GamepadStateProvider {
  /**
   * The current captured state
   */
  public readonly state: Record<number, GamepadState> = []

  public readonly pads: Gamepad[] = []
  /**
   * Is called on the `gamepadconnected` event
   */
  protected readonly onConnected = this.handleConnectionEvent.bind(this)

  /**
   * Is called on the `gamepaddisconnected` event
   */
  protected readonly onDisconnected = this.handleDisconnectionEvent.bind(this)

  /**
   * Initializes the Gamepads with given options
   */
  constructor() {
    this.activate()
  }

  public getState(out?: Record<number, GamepadState>): Record<number, GamepadState> {
    this.update()
    return copyGamepadState(this.state, out)
  }

  public dispose(): void {
    this.deactivate()
  }

  /**
   * Activates all event listeners and starts tracking
   *
   * @remarks
   * If {@link Gamepads.autoUpdate} is `true` then an poll loop is scheduled for automatic
   * state update.
   */
  public activate() {
    this.deactivate()
    window.addEventListener('gamepadconnected', this.onConnected)
    window.addEventListener('gamepaddisconnected', this.onDisconnected)
  }

  /**
   * Deactivates all event listeners and stops the auto update loop if it is active
   */
  public deactivate() {
    window.removeEventListener('gamepadconnected', this.onConnected)
    window.removeEventListener('gamepaddisconnected', this.onDisconnected)
  }

  /**
   * Polls all gamepad states and captures the data.
   *
   * @remarks
   * Triggers the `changed` event for every game pad state
   * that has been changed.
   */
  public update() {
    let pads = navigator.getGamepads()

    for (let i = 0; i < pads.length; i++) {
      this.pads[i] = pads[i]
      if (this.pads[i]) {
        this.captureState(this.pads[i])
      }
    }
  }

  protected handleConnectionEvent(e: GamepadEvent) {
    this.captureState(e.gamepad)
  }

  protected handleDisconnectionEvent(e: GamepadEvent) {
    this.captureState(e.gamepad)
  }

  private captureState(pad: Gamepad) {
    const index = pad.index
    this.state[index] ||= {
      index: index,
      axes: [],
      buttons: [],
      connected: !!pad?.connected,
      timestamp: pad?.timestamp,
    }
    for (let i = 0; i < pad.axes.length; i++) {
      this.state[index].axes[i] = pad.axes[i]
    }
    for (let i = 0; i < pad.buttons.length; i++) {
      this.state[index].buttons[i] =
        (pad.buttons[i].pressed ? 1 : 0) || (pad.buttons[i].touched ? 1 : 0) || pad.buttons[i].value
    }
    this.state[index].index = index
    this.state[index].connected = pad.connected
    this.state[index].timestamp = pad.timestamp
  }
}
