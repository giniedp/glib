import { Events, Loop, loop } from '@gglib/utils'

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
export class Gamepads extends Events {
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
  /**
   * Initializes the Gamepads with given options
   */
  constructor(options?: IGamepadsOptions) {
    super()
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
      this.poll.kill()
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
        this.trigger('changed', this, index)
      }
    }
  }
}

/**
 * @public
 */
export const GamepadButton = Object.freeze({
  // Face (main) buttons
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  // Top shoulder buttons
  LeftShoulder: 4,
  RightShoulder: 5,
  // Bottom shoulder buttons
  LeftTrigger: 6,
  RightTrigger: 7,
  // The back or select button
  Back: 8,
  // The start button
  Start: 9,
  // Analogue sticks (if depressible)
  LeftStick: 10,
  RightStick: 11,
  // Directional (discrete) pad
  DPadUp: 12,
  DPadDown: 13,
  DPadLeft: 14,
  DPadRight: 15,

  // any extra buttons
  Extra1: 16,
  Extra2: 17,
  Extra3: 18,
  Extra4: 19,
  Extra5: 20,
  Extra6: 21,
  Extra7: 22,
  Extra8: 23,
  Extra9: 24,
})

/**
 * @public
 */
export const GamepadButtonNames = Object.freeze({
  0: 'A',
  1: 'B',
  2: 'X',
  3: 'Y',
  4: 'LeftShoulder',
  5: 'RightShoulder',
  6: 'LeftTrigger',
  7: 'RightTrigger',
  8: 'Back',
  9: 'Start',
  10: 'LeftStick',
  11: 'RightStick',
  12: 'DPadUp',
  13: 'DPadDown',
  14: 'DPadLeft',
  15: 'DPadRight',
  16: 'Extra1',
  17: 'Extra2',
  18: 'Extra3',
  19: 'Extra4',
  20: 'Extra5',
  21: 'Extra6',
  22: 'Extra7',
  23: 'Extra8',
  24: 'Extra9',
})

/**
 * @public
 */
export const GamepadAxes = Object.freeze({
  LeftHorizontal: 0,
  LeftVertical: 1,
  RightHorizontal: 2,
  RightVertical: 3,
})

/**
 * @public
 */
export const GamepadAxesNames = Object.freeze({
  0: 'LeftHorizontal',
  1: 'LeftVertical',
  2: 'RightHorizontal',
  3: 'RightVertical',
})
