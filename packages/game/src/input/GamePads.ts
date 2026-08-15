import { brand, Brand, eventSource, Loop, loop } from '@gglib/utils'

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

export interface GamepadAdapter {
  capture(): void
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
      this.poll = null
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
    pad.axes
    if (this.state[index] !== pad) {
      this.state[index] = pad
      if (!silent) {
        this.onChanged.emit(pad)
      }
    }
  }
}

export type GamepadButton = Brand<number, 'GamepadButton'>

/**
 * @public
 */
export const GamepadButton = {
  // Face (main) buttons
  A: brand<GamepadButton>(0),
  B: brand<GamepadButton>(1),
  X: brand<GamepadButton>(2),
  Y: brand<GamepadButton>(3),
  // Top shoulder buttons
  LeftShoulder: brand<GamepadButton>(4),
  RightShoulder: brand<GamepadButton>(5),
  // Bottom shoulder buttons
  LeftTrigger: brand<GamepadButton>(6),
  RightTrigger: brand<GamepadButton>(7),
  // The back or select button
  Back: brand<GamepadButton>(8),
  // The start button
  Start: brand<GamepadButton>(9),
  // Analogue sticks (if depressible)
  LeftStick: brand<GamepadButton>(10),
  RightStick: brand<GamepadButton>(11),
  // Directional (discrete) pad
  DPadUp: brand<GamepadButton>(12),
  DPadDown: brand<GamepadButton>(13),
  DPadLeft: brand<GamepadButton>(14),
  DPadRight: brand<GamepadButton>(15),

  // any extra buttons
  Extra1: brand<GamepadButton>(16),
  Extra2: brand<GamepadButton>(17),
  Extra3: brand<GamepadButton>(18),
  Extra4: brand<GamepadButton>(19),
  Extra5: brand<GamepadButton>(20),
  Extra6: brand<GamepadButton>(21),
  Extra7: brand<GamepadButton>(22),
  Extra8: brand<GamepadButton>(23),
  Extra9: brand<GamepadButton>(24),
}
