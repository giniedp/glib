import { eventSource, Loop, loop } from '@gglib/utils'

/**
 * Constructor options for {@link Gamepads}
 *
 * @public
 */
export interface IGamepadsOptions {
  /**
   * If true, the polling of new gamepad state is done automatically
   */
  autoUpdate?: boolean
}

/**
 * A wrapper class around the
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API | Gamepad API}
 *
 * @public
 */
export class Gamepads {
  /**
   * The current captured state
   */
  public readonly state: Gamepad[] = []
  /**
   * Whether automatic state polling should be activated or not
   */
  protected autoUpdate: boolean = true
  /**
   * Is called on the `gamepadconnected` event
   */
  protected readonly onConnected = this.handleConnectionEvent.bind(this)
  /**
   * Is called on the `gamepaddisconnected` event
   */
  protected readonly onDisconnected = this.handleDisconnectionEvent.bind(this)
  /**
   * If {@link Gamepads.autoUpdate} is `true` then this holds the polling loop which captures the state automatically
   */
  protected poll: Loop = null

  public onChanged = eventSource<Gamepad>()

  /**
   * Initializes the Gamepads with given options
   */
  constructor(options?: IGamepadsOptions) {
    if (options && options.autoUpdate != null) {
      this.autoUpdate = !!options.autoUpdate
    }
    this.activate()
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
    if (this.autoUpdate) {
      this.poll = loop(() => this.update(false))
    }
  }

  /**
   * Deactivates all event listeners and stops the auto update loop if it is active
   */
  public deactivate() {
    window.removeEventListener('gamepadconnected', this.onConnected)
    window.removeEventListener('gamepaddisconnected', this.onDisconnected)
    if (this.poll) {
      this.poll.stop()
    }
  }

  /**
   * Polls all gamepad states and captures the data.
   *
   * @remarks
   * Triggers the `changed` event for every game pad state
   * that has been changed.
   */
  public update(silent: boolean) {
    let pads = navigator.getGamepads()
    for (let i = 0; i < pads.length; i++) {
      this.captureState(pads[i], i, silent)
    }
  }

  protected handleConnectionEvent(e: GamepadEvent) {
    this.captureState(e.gamepad, e.gamepad.index, false)
  }

  protected handleDisconnectionEvent(e: GamepadEvent) {
    this.captureState(e.gamepad, e.gamepad.index, false)
  }

  private captureState(pad: Gamepad, index: number, silent: boolean) {
    if (this.state[index] !== pad) {
      this.state[index] = pad
      if (!silent) {
        this.onChanged.emit(pad)
      }
    }
  }
}

export type GamepadButton = number & { __brand: 'GamepadButton' }

/**
 * @public
 */
export const GamepadButton = {
  // Face (main) buttons
  A: 0 as GamepadButton,
  B: 1 as GamepadButton,
  X: 2 as GamepadButton,
  Y: 3 as GamepadButton,
  // Top shoulder buttons
  LeftShoulder: 4 as GamepadButton,
  RightShoulder: 5 as GamepadButton,
  // Bottom shoulder buttons
  LeftTrigger: 6 as GamepadButton,
  RightTrigger: 7 as GamepadButton,
  // The back or select button
  Back: 8 as GamepadButton,
  // The start button
  Start: 9 as GamepadButton,
  // Analogue sticks (if depressible)
  LeftStick: 10 as GamepadButton,
  RightStick: 11 as GamepadButton,
  // Directional (discrete) pad
  DPadUp: 12 as GamepadButton,
  DPadDown: 13 as GamepadButton,
  DPadLeft: 14 as GamepadButton,
  DPadRight: 15 as GamepadButton,

  // any extra buttons
  Extra1: 16 as GamepadButton,
  Extra2: 17 as GamepadButton,
  Extra3: 18 as GamepadButton,
  Extra4: 19 as GamepadButton,
  Extra5: 20 as GamepadButton,
  Extra6: 21 as GamepadButton,
  Extra7: 22 as GamepadButton,
  Extra8: 23 as GamepadButton,
  Extra9: 24 as GamepadButton,
}

export type GamepadAxes = number & { __brand: 'GamepadAxes' }

/**
 * @public
 */
export const GamepadAxes = {
  LeftHorizontal: 0 as GamepadAxes,
  LeftVertical: 1 as GamepadAxes,
  RightHorizontal: 2 as GamepadAxes,
  RightVertical: 3 as GamepadAxes,
}
