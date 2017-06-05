import { Events, Loop, loop } from '@glib/core'

const statekeys = ['id', 'index', 'connected', 'mapping', 'timestamp']

/**
 * Gamepads constructor options
 */
export interface IGamepadsOptions {
  autopoll?: boolean
}
export interface GamepadButton {
    pressed: boolean
    value: number
}
/**
 * The captured state of a gamepad
 */
export interface IGamepadState {
  buttonValues: number[]
  axes: number[]
  buttons: GamepadButton[]
  connected: boolean
  id: string
  index: number
  mapping: string
  timestamp: number
}

function emptyGamepadState(): IGamepadState {
  return {
    buttonValues: null,
    axes: null,
    buttons: null,
    connected: null,
    id: null,
    index: null,
    mapping: null,
    timestamp: null,
  }
}

export class Gamepads extends Events {
  /**
   * The current captured state
   */
  public state: IGamepadState[] = []
  /**
   * Whetgher automatic state polling should be activated or not
   */
  protected autopoll: boolean = true
  /**
   * Is called on the ```gamepadconnected``` event
   */
  protected onConnected = this.handleConnectionEvent.bind(this)
  /**
   * Is called on the ```gamepaddisconnected``` event
   */
  protected onDisconnected = this.handleDisconnectionEvent.bind(this)
  /**
   * If ```autopoll``` is true then this holds the poll loop to capture a new state frequently
   */
  protected poll: Loop = null
  /**
   * Initialises the Gamepads with given options
   */
  constructor(options?: IGamepadsOptions) {
    super()
    if (options && options.autopoll != null) {
      this.autopoll = !!options.autopoll
    }
    this.activate()
  }

  /**
   * Activates all event listeners. If ```autopoll``` is true then
   * the poll loop is started
   */
  public activate() {
    this.deactivate()
    window.addEventListener('mozgamepadconnected', this.onConnected)
    window.addEventListener('mozgamepaddisconnected', this.onDisconnected)
    if (this.autopoll) {
      this.poll = loop(this.pollState.bind(this))
    }
  }

  /**
   * Deactivates all event listeners and stops the poll loop if it is active
   */
  public deactivate() {
    window.removeEventListener('mozgamepadconnected', this.onConnected)
    window.removeEventListener('mozgamepaddisconnected', this.onDisconnected)
    if (this.poll) { this.poll.kill() }
  }

  /**
   * Polls all gamepad states and captures the data. If any gamepad state has changed
   * this triggers the ```changed``` event.
   */
  public pollState(trigger: boolean= true) {

    let pads = navigator.getGamepads()
    let changed = false
    for (let i = 0; i < pads.length; i++) {
      let pad = pads[i]
      if (!pad) {
        if (this.state[i]) {
          delete this.state[i]
          changed = true
        }
      } else {
        changed = this.captureState(pad) || changed
      }
    }
    if (changed && trigger) {
      this.trigger('changed', this)
    }
  }

  protected handleConnectionEvent(e: GamepadEvent) {
    // this.gamepads[e.gamepad.index] = e.gamepad
    this.captureState(e.gamepad)
    this.trigger('changed', this, e)
  }
  protected handleDisconnectionEvent(e: GamepadEvent) {
    // this.gamepads[e.gamepad.index] = null
    this.captureState(e.gamepad)
    this.trigger('changed', this, e)
  }

  /**
   * Gets a copy of the current state for given identifier.
   */
  public copyState(index: number, out: any= {}): IGamepadState {
    let state = this.state[index]
    let result = out as IGamepadState
    // make sure arrays exist
    result.axes = result.axes || []
    result.buttons = result.buttons || []
    result.buttonValues = result.buttonValues || []
    if (!state) {
      // make sure the interface is fullfilled
      for (let key of statekeys) { result[key] = void 0 }
      // empty state arrays
      result.axes.length = 0
      result.buttons.length = 0
      result.buttonValues.length = 0
      // fix index property and mark as disconnected
      result.index = index
      result.connected = false
      return result
    }
    // copy shallow data
    for (let key of statekeys) {
      result[key] = state[key]
    }
    // copy button data
    for (let i = 0; i < state.buttons.length; i++) {
      result.buttons[i] = result.buttons[i] || {} as GamepadButton // tslint:disable-line
      result.buttons[i].pressed = state.buttons[i].pressed
      result.buttons[i].value = state.buttons[i].value
      result.buttonValues[i] = state.buttonValues[i]
    }
    // copy axis data
    for (let i = 0; i < state.axes.length; i++) {
      result.axes[i] = state.axes[i]
    }
    return result
  }

  protected captureState(pad: Gamepad): boolean {
    let changed = false
    let state: IGamepadState = this.state[pad.index] || emptyGamepadState()

    // if timestamp did not change, there was no change in state
    if ((state.timestamp === pad.timestamp) && (pad.timestamp !== void 0)) {
      return false
    }
    // ensure arrays exist
    state.axes = state.axes || []
    state.buttons = state.buttons || []
    state.buttonValues = state.buttonValues || []
    // copy shallow data
    for (let key of statekeys) {
      changed = (changed || (state[key] !== pad[key]))
      state[key] = pad[key]
    }
    // copy button data
    changed = (changed || (state.buttons.length !== pad.buttons.length))
    for (let i = 0; i < pad.buttons.length; i++) {
      let a = state.buttons[i] || {} as GamepadButton // tslint:disable-line
      let b = pad.buttons[i]
      changed = (changed || (a.value !== b.value))
      changed = (changed || (a.pressed !== b.pressed))
      a.pressed = b.pressed
      a.value = b.value
      state.buttons[i] = a
      state.buttonValues[i] = b.value
    }
    // copy axis data
    changed = (changed || (state.axes.length !== pad.axes.length))
    for (let i = 0; i < pad.axes.length; i++) {
      changed = (changed || (state.axes[i] !== pad.axes[i]))
      state.axes[i] = pad.axes[i]
    }
    this.state[pad.index] = state
    return changed
  }
}

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
export const GamepadButtonNames = {}
for (const name in GamepadButton) {
  if (GamepadButton.hasOwnProperty(name)) {
    GamepadButtonNames[GamepadButton[name]] = name
  }
}
Object.freeze(GamepadButtonNames)

export const GamepadAxes = Object.freeze({
  LeftHorizontal: 0,
  LeftVertical: 1,
  RightHorizontal: 2,
  RightVertical: 3,
})
export const GamepadAxesNames = {}
for (const name in GamepadAxes) {
  if (GamepadAxes.hasOwnProperty(name)) {
    GamepadAxesNames[GamepadAxes[name]] = name
  }
}
Object.freeze(GamepadAxesNames)
