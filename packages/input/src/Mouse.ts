import { Events, Log, offDocumentVisibilityChange, onDocumentVisibilityChange } from '@gglib/core'

function prefix(vendor: string, name: string, upper: boolean): string {
  if (vendor == null) { return null }
  if (vendor === '') { return name }
  if (upper) {
    name = name[0] + name.substr(1)
  }
  return vendor + name
}
const browser = (() => {
  for (const name of ['', 'moz', 'webkit', 'ms', 'o']) {
    let pref = prefix(name, 'exitPointerLock', true)
    if (pref in document) { return name }
  }
})()

const cross = {
  requestPointerLock: prefix(browser, 'requestPointerLock', true),
  exitPointerLock: prefix(browser, 'exitPointerLock', true),
  pointerlockchange: prefix(browser, 'pointerlockchange', false),
  pointerlockerror: prefix(browser, 'pointerlockerror', false),
  pointerLockElement: prefix(browser, 'pointerLockElement', true),

  movementX: prefix(browser, 'movementX', true),
  movementY: prefix(browser, 'movementY', true),
}
const hasPointerlockApi = !!cross.requestPointerLock

/**
 * Mouse constructor options
 *
 * @public
 */
export interface IMouseOptions {
  eventTarget?: EventTarget,
  events?: string[]
}

/**
 * The captured Mouse state
 *
 * @public
 */
export interface IMouseState {
  pageX: number
  pageY: number
  screenX: number
  screenY: number
  clientX: number
  clientY: number
  x: number
  y: number
  movementX: number
  movementY: number
  wheel: number
  buttons: boolean[]
}

/**
 * Captures the mouse state.
 *
 * @remarks
 * The mouse events are captured at the given {@link IMouseOptions.eventTarget}. Using these events a mouse state
 * is recorded. On each recognized  state change the `changed` event is triggered.
 *
 * @public
 */
export class Mouse extends Events {
  /**
   * The target eventTarget at which to listen for mouse events.
   */
  protected readonly eventTarget: EventTarget = document

  /**
   * The current Mouse state
   */
  public readonly state: IMouseState = {
    pageX: 0,
    pageY: 0,
    screenX: 0,
    screenY: 0,
    clientX: 0,
    clientY: 0,
    x: 0,
    y: 0,
    wheel: 0,
    movementX: 0,
    movementY: 0,
    buttons: [false, false, false],
  }

  /**
   * {@link https://developer.mozilla.org/de/docs/Web/Events | Event} names that are delegated to this instance.
   */
  protected readonly delegatedEvents = [
    'click',
    'contextmenu',
    'dblclick',
    'mousedown',
    'mouseenter',
    'mouseleave',
    'mousemove',
    'mouseout',
    'mouseover',
    'mouseup',
    'show',
    'mousewheel',
  ]

  /**
   * Listener for {@link https://developer.mozilla.org/de/docs/Web/Events/wheel | wheel} events
   */
  protected readonly onMouseWheelListener: EventListener = this.onMouseWheel.bind(this)
  /**
   * Listener for {@link https://developer.mozilla.org/de/docs/Web/Events/mousemove | mousemove} events
   */
  protected readonly onMouseMoveListener: EventListener = this.onMouseMove.bind(this)
  /**
   * Listener for {@link https://developer.mozilla.org/de/docs/Web/Events/mousedown | mousedown} events
   */
  protected readonly onMouseDownListener: EventListener = this.onMouseButton.bind(this)
  /**
   * Listener for {@link https://developer.mozilla.org/de/docs/Web/Events/mouseup | mouseup} events
   */
  protected readonly onMouseUpListener: EventListener = this.onMouseButton.bind(this)
  /**
   * Listener for any {@link https://developer.mozilla.org/de/docs/Web/Events | Event}
   * see {@link delegatedEvents}.
   */
  protected readonly onEvent: EventListener = (e) => this.trigger(e.type, this, e)
  /**
   * Listener that issues a clear state operation on this instance
   */
  protected readonly onClearStateListener: EventListener = this.onClearState.bind(this)

  /**
   * Initializes the Mouse with given options and activates the capture listeners
   */
  constructor(options?: IMouseOptions) {
    super()
    if (options) {
      this.eventTarget = (options.eventTarget || this.eventTarget)
      this.delegatedEvents = (options.events || this.delegatedEvents)
    }
    this.activate()
  }

  /**
   * Activates the capture listeners
   */
  public activate() {
    this.deactivate()
    // update state events
    this.eventTarget.addEventListener('mousewheel', this.onMouseWheelListener)
    this.eventTarget.addEventListener('mousemove', this.onMouseMoveListener)
    this.eventTarget.addEventListener('mousedown', this.onMouseDownListener)
    this.eventTarget.addEventListener('mouseup', this.onMouseUpListener)
    // visibility events
    onDocumentVisibilityChange(this.onClearStateListener)
    document.addEventListener('blur', this.onClearStateListener)
    window.addEventListener('blur', this.onClearStateListener)
    // delegated events
    for (let name of this.delegatedEvents) {
      this.eventTarget.addEventListener(name, this.onEvent)
    }
    // pointerlock events
    if (hasPointerlockApi) {
      document.addEventListener(cross.pointerlockchange, this.onEvent)
      document.addEventListener(cross.pointerlockerror, this.onEvent)
    }
  }

  /**
   * Deactivates the capture listeners
   */
  public deactivate() {
    // update logic events
    this.eventTarget.removeEventListener('mousewheel', this.onMouseWheelListener)
    this.eventTarget.removeEventListener('mousemove', this.onMouseMoveListener)
    this.eventTarget.removeEventListener('mousedown', this.onMouseDownListener)
    this.eventTarget.removeEventListener('mouseup', this.onMouseUpListener)
    // visibility events
    offDocumentVisibilityChange(this.onClearStateListener)
    document.removeEventListener('blur', this.onClearStateListener)
    window.removeEventListener('blur', this.onClearStateListener)
    // delegated events
    for (let name of this.delegatedEvents) {
      this.eventTarget.removeEventListener(name, this.onEvent)
    }
    // pointerlock events
    if (hasPointerlockApi) {
      document.removeEventListener(cross.pointerlockchange, this.onEvent)
      document.removeEventListener(cross.pointerlockerror, this.onEvent)
    }
  }

  /**
   * Gets a copy of the captured state
   * @param out - Where the state is written to
   */
  public copyState(out: any = {}): IMouseState {
    out.x = this.state.x
    out.y = this.state.y
    out.wheelValue = this.state.wheel
    out.buttons = out.buttons || []
    out.buttons.length = 3
    out.buttons[0] = this.state.buttons[0]
    out.buttons[1] = this.state.buttons[1]
    out.buttons[2] = this.state.buttons[2]
    return out
  }

  /**
   * Locks the mouse to the current element.
   *
   * @remarks
   * Mouse cursor will be invisible and only the `movementX` and `movementY` state properties are updated.
   */
  public lock() {
    if (!hasPointerlockApi) {
      Log.w('[Mouse] pointerlock api is not available')
      return
    }
    if (this.eventTarget === document[cross.pointerLockElement]) {
      return
    }
    if (this.eventTarget instanceof Element) {
      this.eventTarget[cross.requestPointerLock]()
    } else {
      Log.w('[Mouse] lock() is only available for elements of type "Element"')
    }
  }
  /**
   * Checks for an active mouse lock in the document
   *
   * @returns true if any document element has a mouse lock
   */
  public isLocked(): boolean {
    return Mouse.isLocked()
  }
  /**
   * Releases the active mouse lock in the document
   */
  public unlock() {
    return Mouse.unlock()
  }
  /**
   * Checks for an active mouse lock
   */
  public static isLocked(): boolean {
    return !!document[cross.pointerLockElement]
  }
  /**
   * Releases the mouse lock
   */
  public static unlock() {
    if (hasPointerlockApi) {
      document[cross.exitPointerLock]()
    } else {
      Log.w('[Mouse] pointerlock api is not available')
    }
  }

  /**
   * Updates the movement state from given event
   */
  protected onMouseMove(e: MouseEvent) {
    let s = this.state
    s.pageX = e.pageX
    s.pageY = e.pageY
    s.screenX = e.screenX
    s.screenY = e.screenY
    s.clientX = e.clientX
    s.clientY = e.clientY
    s.movementX = e[cross.movementX]
    s.movementY = e[cross.movementY]
    s.x = e.clientX
    s.y = e.clientY
    if (this.eventTarget['getBoundingClientRect']) {
      let rect = this.eventTarget['getBoundingClientRect']()
      s.x = e.clientX - rect.left
      s.y = e.clientY - rect.top
    }
    this.trigger('changed', this, e)
  }

  /**
   * Updates the button states from given event
   */
  protected onMouseButton(e: MouseEvent) {
    let isDown = e.type === 'mousedown'
    if (e.which !== undefined) {
      this.state.buttons[e.which - 1] = isDown
    } else if (e.button !== undefined) {
      this.state.buttons[e.button] = isDown
    }
    this.trigger('changed', this, e)
  }

  /**
   * Updates the wheel state from given event
   */
  protected onMouseWheel(e: MouseEvent) {
    let state = this.state
    state.wheel = state.wheel || 0
    if (e.detail) {
      state.wheel += -1 * e.detail
    } else if (e['wheelDelta']) {
      state.wheel += e['wheelDelta'] / 120
    } else {
      state.wheel += 0
    }
    this.trigger('changed', this, e)
  }

  /**
   * Clears the tracked state
   */
  protected onClearState() {
    this.state.wheel = 0
    this.state.buttons.length = 3
    this.state.buttons[0] = false
    this.state.buttons[1] = false
    this.state.buttons[2] = false
    this.trigger('changed', this, null)
  }
}

export const MouseButton = Object.freeze({
  Left: 0,
  Middle: 1,
  Right: 2,
})

export const MouseButtonName = {}
for (const name in MouseButton) {
  if (MouseButton.hasOwnProperty(name)) {
    MouseButtonName[MouseButton[name]] = name
  }
}
Object.freeze(MouseButtonName)
