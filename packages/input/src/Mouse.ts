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
  element?: EventTarget,
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
 * The Mouse class allows to capture the mouse state. It does so by listening to various mouse events
 * and tracks the position and pressed buttons. On each recoginzed  state change the ```changed``` event is triggered.
 *
 * @public
 */
export class Mouse extends Events {
  /**
   * The target element on which to listen for mouse events.
   */
  protected element: EventTarget = document

  /**
   * The tracked Mouse state
   */
  public state: IMouseState = {
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
   * Collection of html events that are delegated (triggered) on this instance.
   */
  protected delegatedEvents = [
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
   * Is called on the ```mousewheel``` event and captures the mouse wheel state
   */
  protected onMouseWheel: EventListener = this.handleWheel.bind(this)
  /**
   * Is called on the ```mousemove``` event and captures the movement state
   */
  protected onMouseMove: EventListener = this.handleMouseMove.bind(this)
  /**
   * Is called on the ```mousedown``` event and captures the button state
   */
  protected onMouseDown: EventListener = this.handleButton.bind(this)
  /**
   * Is called on the ```mouseup``` event and captures the button state
   */
  protected onMouseUp: EventListener = this.handleButton.bind(this)
  /**
   * Triggers the ```e.type``` event on this instance
   */
  protected onEvent: EventListener = (e) => this.trigger(e.type, this, e)
  /**
   * Is called when ```document``` or ```window``` loose focus (e.g. user switches to another tab or application)
   * and clears the button and wheel states.
   */
  protected onClearButtons: EventListener = this.clearButtons.bind(this)

  /**
   * Initializes the Mouse with given options and activates the captrue listeners
   */
  constructor(options?: IMouseOptions) {
    super()
    if (options) {
      this.element = (options.element || this.element)
      this.delegatedEvents = (options.events || this.delegatedEvents)
    }
    this.activate()
  }

  /**
   * Activates the captrue listeners
   */
  public activate() {
    this.deactivate()
    // update state events
    this.element.addEventListener('mousewheel', this.onMouseWheel)
    this.element.addEventListener('mousemove', this.onMouseMove)
    this.element.addEventListener('mousedown', this.onMouseDown)
    this.element.addEventListener('mouseup', this.onMouseUp)
    // visibility events
    onDocumentVisibilityChange(this.onClearButtons)
    document.addEventListener('blur', this.onClearButtons)
    window.addEventListener('blur', this.onClearButtons)
    // delegated events
    for (let name of this.delegatedEvents) {
      this.element.addEventListener(name, this.onEvent)
    }
    // pointerlock events
    if (hasPointerlockApi) {
      document.addEventListener(cross.pointerlockchange, this.onEvent)
      document.addEventListener(cross.pointerlockerror, this.onEvent)
    }
  }

  /**
   * Deactivates the captrue listeners
   */
  public deactivate() {
    // update logic events
    this.element.removeEventListener('mousewheel', this.onMouseWheel)
    this.element.removeEventListener('mousemove', this.onMouseMove)
    this.element.removeEventListener('mousedown', this.onMouseDown)
    this.element.removeEventListener('mouseup', this.onMouseUp)
    // visibility events
    offDocumentVisibilityChange(this.onClearButtons)
    document.removeEventListener('blur', this.onClearButtons)
    window.removeEventListener('blur', this.onClearButtons)
    // delegated events
    for (let name of this.delegatedEvents) {
      this.element.removeEventListener(name, this.onEvent)
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
   * Locks the mouse to the current element. The mouse cursor is then not visible
   * and only the ```movementX``` and ```movementY``` state properties are updated.
   */
  public lock() {
    if (!hasPointerlockApi) {
      Log.w('[Mouse] pointerlock api is not available')
      return
    }
    if (this.element === document[cross.pointerLockElement]) {
      return
    }
    if (this.element instanceof Element) {
      this.element[cross.requestPointerLock]()
    } else {
      Log.w('[Mouse] lock() is only available for elements of type "Element"')
    }
  }
  /**
   * Checks whether the mouse is already locked to any element
   */
  public isLocked(): boolean {
    return Mouse.isLocked()
  }
  /**
   * Releases any locked Mouse
   */
  public unlock() {
    return Mouse.unlock()
  }
  /**
   * Checks whether the mouse is already locked to any element
   */
  public static isLocked(): boolean {
    return !!document[cross.pointerLockElement]
  }
  /**
   * Releases any locked Mouse
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
  protected handleMouseMove(e: MouseEvent) {
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
    if (this.element['getBoundingClientRect']) {
      let rect = this.element['getBoundingClientRect']()
      s.x = e.clientX - rect.left
      s.y = e.clientY - rect.top
    }
    this.trigger('changed', this, e)
  }

  /**
   * Updates the button states from given event
   */
  protected handleButton(e: MouseEvent) {
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
  protected handleWheel(e: MouseEvent) {
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
   * clears the button and wheel states
   */
  protected clearButtons() {
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
