import { Events, offDocumentVisibilityChange, onDocumentVisibilityChange } from '@gglib/core'

const stateKeys: Array<keyof ITouchState> = ['identifier', 'pageX', 'pageY', 'screenX', 'screenY', 'clientX', 'clientY', 'x', 'y']

/**
 * TouchPane constructor options
 *
 * @public
 */
export interface ITouchPaneOptions {
  eventTarget?: EventTarget,
  events?: string[]
}

/**
 * The captured touch state
 *
 * @public
 */
export interface ITouchState {
  identifier: number
  pageX: number
  pageY: number
  screenX: number
  screenY: number
  clientX: number
  clientY: number
  x: number
  y: number
}

/**
 * The TouchPane class captures the current touch input state
 *
 * @remarks
 * Listens to the `touchstart`, `touchmove`, `touchend` and `touchcancel`
 * events and tracks the touch position and movement.
 * On each recognized state change the `changed` event is triggered.
 *
 * @public
 */
export class TouchPane extends Events  {
  /**
   * The current captured state
   */
  public state: { [identifier: string]: ITouchState } = {}
  /**
   * If `true` calls `preventDefault` on each received event
   */
  public preventDefault = false
  /**
   * The target element on which to listen for touch events.
   */
  protected eventTarget: EventTarget = document
  /**
   * Is called on the `touchcancel` event
   */
  protected onTouchCancel = this.handleTouchCancel.bind(this)
  /**
   * Is called on the `touchstart` event
   */
  protected onTouchStart = this.handleTouchStart.bind(this)
  /**
   * Is called on the `touchmove` event
   */
  protected onTouchMove = this.handleTouchMove.bind(this)
  /**
   * Is called on the `touchend` event
   */
  protected onTouchEnd = this.handleTouchEnd.bind(this)
  /**
   * Is called when `document` or `window` loose focus e.g. user switches to another tab or application
   */
  protected onNeedsClear = () => this.clearState()
  /**
   * Triggers the Event that occurred on the element
   */
  protected onEvent: EventListener = (e: Event) => this.trigger(e.type, this, e)
  /**
   * Collection of html events that are delegated (triggered) on this instance.
   */
  protected delegatedEvents = [
    'touchcancel',
    'touchstart',
    'touchmove',
    'touchend',
  ]

  /**
   * Initializes the TouchPane with given options and activates the capture listeners
   */
  constructor(options?: ITouchPaneOptions) {
    super()
    if (options) {
      this.eventTarget = (options.eventTarget || this.eventTarget)
    }
    this.activate()
  }

  /**
   * Activates the capture listeners
   */
  public activate() {
    this.deactivate()
    // update events
    this.eventTarget.addEventListener('touchcancel', this.onTouchCancel)
    this.eventTarget.addEventListener('touchstart', this.onTouchStart)
    this.eventTarget.addEventListener('touchmove', this.onTouchMove)
    this.eventTarget.addEventListener('touchend', this.onTouchEnd)
    // visibility events
    onDocumentVisibilityChange(this.onNeedsClear)
    document.addEventListener('blur', this.onNeedsClear)
    window.addEventListener('blur', this.onNeedsClear)
    // delegated events
    for (let name of this.delegatedEvents) {
      this.eventTarget.addEventListener(name, this.onEvent)
    }
  }

  /**
   * Deactivates the capture listeners
   */
  public deactivate() {
    this.eventTarget.removeEventListener('touchcancel', this.onTouchCancel)
    this.eventTarget.removeEventListener('touchstart', this.onTouchStart)
    this.eventTarget.removeEventListener('touchmove', this.onTouchMove)
    this.eventTarget.removeEventListener('touchend', this.onTouchEnd)
    // visibility events
    offDocumentVisibilityChange(this.onNeedsClear)
    document.removeEventListener('blur', this.onNeedsClear)
    window.removeEventListener('blur', this.onNeedsClear)
    // delegated events
    for (let name of this.delegatedEvents) {
      this.eventTarget.removeEventListener(name, this.onEvent)
    }
  }

  /**
   * Gets a copy of the current state for given identifier.
   */
  public copyState(id: number, out: any= {}): ITouchState {
    let state = this.state[id]
    if (!state) {
      for (let key of stateKeys) { out[key] = void 0 }
      out.identifier = id
      out.active = false
      return out
    }
    for (let key of stateKeys) { out[key] = state[key] }
    out.identifier = id
    out.active = true
    return out
  }
  /**
   * Clears all captured states (or a specific if an `id` is given)
   */
  public clearState(id?: number) {
    if (id !== undefined) {
      delete this.state[id]
      return
    }
    for (let key of stateKeys) {
      delete this.state[key]
    }
  }
  /**
   * Updates the state from given `touchstart` event
   */
  private handleTouchStart(e: TouchEvent) {
    let list = e.changedTouches
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < list.length; i++) {
      let touch = list[i]
      this.state[touch.identifier] = TouchPane.copyState(touch, this.eventTarget, this.state[touch.identifier] || {})
    }
    if (this.preventDefault) { e.preventDefault() }
    this.trigger('changed', this, e)
  }
  /**
   * Updates the state from given `touchcancel` event
   */
  private handleTouchCancel(e: TouchEvent) {
    let list = e.changedTouches
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < list.length; i++) {
      let touch = list[i]
      delete this.state[touch.identifier]
    }
    if (this.preventDefault) { e.preventDefault() }
    this.trigger('changed', this, e)
  }
  /**
   * Updates the state from given `touchmove` event
   */
  private handleTouchMove(e: TouchEvent) {
    let list = e.changedTouches
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < list.length; i++) {
      let touch = list[i]
      this.state[touch.identifier] = TouchPane.copyState(touch, this.eventTarget, this.state[touch.identifier] || {})
    }
    if (this.preventDefault) { e.preventDefault() }
    this.trigger('changed', this, e)
  }
  /**
   * Updates the state from given `touchend` event
   */
  private handleTouchEnd(e: TouchEvent) {
    let list = e.changedTouches
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < list.length; i++) {
      let touch = list[i]
      delete this.state[touch.identifier]
    }
    if (this.preventDefault) { e.preventDefault() }
    this.trigger('changed', this, e)
  }
  public static copyState(t: Touch, el: EventTarget, out: any): ITouchState {
    for (let key of stateKeys) { out[key] = t[key] }
    out.x = t.clientX
    out.y = t.clientY
    if (el['getBoundingClientRect']) {
      let rect = el['getBoundingClientRect']()
      out.x = t.clientX - rect.left
      out.y = t.clientY - rect.top
    }
    return out
  }
}
