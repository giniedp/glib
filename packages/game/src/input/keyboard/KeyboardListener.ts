import { addItemIfAbsent, eventSource, removeItemUnordered } from '@gglib/utils'
import { copyKeyboardState, KeyboardState, KeyboardStateProvider } from './KeyboardState'

export interface KeyboardListenerOptions {
  /**
   * The element at which to listen for input events
   */
  eventTarget?: EventTarget
}

/**
 * Captures key events and tracks keyboard state.
 *
 * @remarks
 * It does so by listening to
 * the `keypress`, `keydown` and `keyup` events and tracks the pressed buttons. On each recognized
 * state change the `changed` event is triggered.
 *
 * @public
 */
export class KeyboardListener implements KeyboardStateProvider {
  /**
   * The target element on which to listen for keyboard events.
   */
  protected eventTarget: EventTarget = document

  /**
   * Tracked set of pressed {@link KeyboardKey} enum values
   *
   * @remarks
   * Values are {@link KeyboardKey} enum values (numbers)
   */
  public readonly state: KeyboardState = {
    pressedCodes: [],
    pressedKeys: [],
    alt: false,
    ctrl: false,
    meta: false,
    shift: false,
  }

  /**
   * Is called on the `keydown` event and marks the `event.code` as pressed
   */
  protected onKeyDown = (e: Event) => this.setKeyPressed(e as KeyboardEvent)
  /**
   * Is called on the `keyup` event and marks the `event.code` as released
   */
  protected onKeyUp = (e: Event) => this.setKeyReleased(e as KeyboardEvent)
  /**
   * Is called when `document` or `window` loose focus e.g. user switches to another tab or application
   */
  protected onNeedsClear = (e: Event) => this.clearState(e)

  public readonly onChanged = eventSource<KeyboardListener>()

  /**
   * Initializes the Keyboard with given options and activates the capture listeners
   */
  constructor(options?: KeyboardListenerOptions) {
    this.eventTarget = options?.eventTarget ?? this.eventTarget
    this.activate()
  }

  public getState(out?: Partial<KeyboardState>): KeyboardState {
    return copyKeyboardState(this.state, out)
  }

  public dispose(): void {
    this.deactivate()
  }

  /**
   * Activates the capture listeners
   */
  public activate() {
    this.deactivate()
    // update state events
    this.eventTarget.addEventListener('keydown', this.onKeyDown)
    this.eventTarget.addEventListener('keyup', this.onKeyUp)
    // visibility events
    document.addEventListener('visibilitychange', this.onNeedsClear)
    document.addEventListener('contextmenu', this.onNeedsClear)
    document.addEventListener('blur', this.onNeedsClear)
    window.addEventListener('blur', this.onNeedsClear)
  }

  /**
   * Deactivates the capture listeners
   */
  public deactivate() {
    // update state events
    this.eventTarget.removeEventListener('keydown', this.onKeyDown)
    this.eventTarget.removeEventListener('keyup', this.onKeyUp)
    // visibility events
    document.removeEventListener('visibilitychange', this.onNeedsClear)
    document.removeEventListener('contextmenu', this.onNeedsClear)
    document.removeEventListener('blur', this.onNeedsClear)
    window.removeEventListener('blur', this.onNeedsClear)
  }

  /**
   * Marks the given `code` as being pressed and triggers the `changed` event
   */
  protected setKeyPressed(e: KeyboardEvent) {
    if (e.key != null) {
      addItemIfAbsent(this.state.pressedKeys, e.key)
    }
    if (e.code != null) {
      addItemIfAbsent(this.state.pressedCodes, e.code)
    }
    this.state.alt = e.altKey
    this.state.ctrl = e.ctrlKey
    this.state.meta = e.metaKey
    this.state.shift = e.shiftKey
    this.onChanged.emit(this)
  }

  /**
   * Marks the given `keyCode` as not being pressed and triggers the `changed` event
   */
  protected setKeyReleased(e: KeyboardEvent) {
    if (e.key != null) {
      removeItemUnordered(this.state.pressedKeys, e.key)
    }
    if (e.code != null) {
      removeItemUnordered(this.state.pressedCodes, e.code)
    }
    this.state.alt = e.altKey
    this.state.ctrl = e.ctrlKey
    this.state.meta = e.metaKey
    this.state.shift = e.shiftKey
    this.onChanged.emit(this)
  }

  /**
   * Clears the state and triggers the `changed` event
   */
  public clearState(e?: Event) {
    this.state.pressedKeys.length = 0
    this.state.pressedCodes.length = 0
    this.state.alt = false
    this.state.ctrl = false
    this.state.meta = false
    this.state.shift = false
    this.onChanged.emit(this)
  }
}
