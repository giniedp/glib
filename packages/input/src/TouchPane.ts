import { Events, extend, offDocumentVisibilityChange, onDocumentVisibilityChange } from '@gglib/core'
import { IVec3 } from '@gglib/math'

const stateKeys: Array<keyof ITouchState> = ['identifier', 'pageX', 'pageY', 'screenX', 'screenY', 'clientX', 'clientY', 'x', 'y']

/**
 * TouchPane constructor options
 *
 * @public
 */
export interface ITouchPaneOptions {
  element?: Element,
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
 * The TouchPane class allows to capture the touch states. It does so by listening to
 * the ```touchstart```, ```touchmove```, ```touchend``` and ```touchcancel``` events and tracks the touch posisiton and movement.
 * On each recoginzed state change the ```changed``` event is triggered.
 *
 * @public
 */
export class TouchPane extends Events  {
  /**
   * The current captured state
   */
  public state: { [identifier: string]: ITouchState } = {}
  /**
   *
   */
  public preventDefault = false
  /**
   * The target element on which to listen for touch events.
   */
  protected element: EventTarget = document
  /**
   * Is called on the ```touchcancel``` event
   */
  protected onTouchCancel = this.handleTouchCancel.bind(this)
  /**
   * Is called on the ```touchstart``` event
   */
  protected onTouchStart = this.handleTouchStart.bind(this)
  /**
   * Is called on the ```touchmove``` event
   */
  protected onTouchMove = this.handleTouchMove.bind(this)
  /**
   * Is called on the ```touchend``` event
   */
  protected onTouchEnd = this.handleTouchEnd.bind(this)
  /**
   * Is called when ```document``` or ```window``` loose focus e.g. user switches to another tab or application
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
   * Initializes the TouchPane with given options and activates the captrue listeners
   */
  constructor(options?: ITouchPaneOptions) {
    super()
    if (options) {
      this.element = (options.element || this.element)
    }
    this.activate()
  }

  /**
   * Activates the captrue listeners
   */
  public activate() {
    this.deactivate()
    // update events
    this.element.addEventListener('touchcancel', this.onTouchCancel)
    this.element.addEventListener('touchstart', this.onTouchStart)
    this.element.addEventListener('touchmove', this.onTouchMove)
    this.element.addEventListener('touchend', this.onTouchEnd)
    // visibility events
    onDocumentVisibilityChange(this.onNeedsClear)
    document.addEventListener('blur', this.onNeedsClear)
    window.addEventListener('blur', this.onNeedsClear)
    // delegated events
    for (let name of this.delegatedEvents) {
      this.element.addEventListener(name, this.onEvent)
    }
  }

  /**
   * Deactivates the capture listeners
   */
  public deactivate() {
    this.element.removeEventListener('touchcancel', this.onTouchCancel)
    this.element.removeEventListener('touchstart', this.onTouchStart)
    this.element.removeEventListener('touchmove', this.onTouchMove)
    this.element.removeEventListener('touchend', this.onTouchEnd)
    // visibility events
    offDocumentVisibilityChange(this.onNeedsClear)
    document.removeEventListener('blur', this.onNeedsClear)
    window.removeEventListener('blur', this.onNeedsClear)
    // delegated events
    for (let name of this.delegatedEvents) {
      this.element.removeEventListener(name, this.onEvent)
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
   * Clears all captured states (or a spcific if an ```id``` is given)
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
   * Updates the state from given ```touchstart``` event
   */
  private handleTouchStart(e: TouchEvent) {
    let list = e.changedTouches
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < list.length; i++) {
      let touch = list[i]
      this.state[touch.identifier] = TouchPane.copyState(touch, this.element, this.state[touch.identifier] || {})
    }
    if (this.preventDefault) { e.preventDefault() }
    this.trigger('changed', this, e)
  }
  /**
   * Updates the state from given ```touchcancel``` event
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
   * Updates the state from given ```touchmove``` event
   */
  private handleTouchMove(e: TouchEvent) {
    let list = e.changedTouches
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < list.length; i++) {
      let touch = list[i]
      this.state[touch.identifier] = TouchPane.copyState(touch, this.element, this.state[touch.identifier] || {})
    }
    if (this.preventDefault) { e.preventDefault() }
    this.trigger('changed', this, e)
  }
  /**
   * Updates the state from given ```touchend``` event
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
