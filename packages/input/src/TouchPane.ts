import { documentVisibilityApi, eventSource } from '@gglib/utils'

/**
 * TouchPane constructor options
 *
 * @public
 */
export interface ITouchPaneOptions {
  eventTarget?: EventTarget
  events?: string[]
}

/**
 * The TouchPane class captures the current touch input state
 *
 * @remarks
 * Listens to the `touchstart`, `touchmove`, `touchend` and `touchcancel`
 * events and tracks the {@link https://developer.mozilla.org/en-US/docs/Web/API/Touch | Touch} states.
 *
 * On each recognized change of state the `changed` event is triggered.
 *
 * @public
 */
export class TouchPane {
  /**
   * The current captured state
   */
  public touches: Map<number, Touch> = new Map<number, Touch>()
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

  public onChanged = eventSource<TouchPane>()
  /**
   * Initializes the TouchPane with given options and activates the capture listeners
   */
  constructor(options?: ITouchPaneOptions) {
    if (options) {
      this.eventTarget = options.eventTarget || this.eventTarget
    }
    this.activate()
  }

  /**
   * Activates the capture listeners
   */
  public activate() {
    this.deactivate()
    // update events
    this.eventTarget.addEventListener('touchcancel', this.onTouchCancel as any)
    this.eventTarget.addEventListener('touchstart', this.onTouchStart as any)
    this.eventTarget.addEventListener('touchmove', this.onTouchMove as any)
    this.eventTarget.addEventListener('touchend', this.onTouchEnd as any)
    // visibility events
    documentVisibilityApi.onVisibilityChange(this.onNeedsClear)
    document.addEventListener('blur', this.onNeedsClear)
    window.addEventListener('blur', this.onNeedsClear)
  }

  /**
   * Deactivates the capture listeners
   */
  public deactivate() {
    this.eventTarget.removeEventListener('touchcancel', this.onTouchCancel as any)
    this.eventTarget.removeEventListener('touchstart', this.onTouchStart as any)
    this.eventTarget.removeEventListener('touchmove', this.onTouchMove as any)
    this.eventTarget.removeEventListener('touchend', this.onTouchEnd as any)
    // visibility events
    documentVisibilityApi.offVisibilityChange(this.onNeedsClear)
    document.removeEventListener('blur', this.onNeedsClear)
    window.removeEventListener('blur', this.onNeedsClear)
  }

  /**
   * Clears all captured states (or a specific if an `id` is given)
   */
  public clearState(id?: number) {
    if (id !== undefined) {
      this.touches.delete(id)
      return
    }
    this.touches.clear()
  }

  /**
   * Updates the state from given `touchstart` event
   */
  private handleTouchStart(e: TouchEvent) {
    const list = e.changedTouches
    for (let i = 0; i < list.length; i++) {
      this.touches.set(list[i].identifier, list[i])
    }
    if (this.preventDefault) {
      e.preventDefault()
    }
    this.onChanged.emit(this)
  }
  /**
   * Updates the state from given `touchcancel` event
   */
  private handleTouchCancel(e: TouchEvent) {
    const list = e.changedTouches
    for (let i = 0; i < list.length; i++) {
      this.touches.delete(list[i].identifier)
    }
    if (this.preventDefault) {
      e.preventDefault()
    }
    this.onChanged.emit(this)
  }
  /**
   * Updates the state from given `touchmove` event
   */
  private handleTouchMove(e: TouchEvent) {
    const list = e.changedTouches
    for (let i = 0; i < list.length; i++) {
      this.touches.set(list[i].identifier, list[i])
    }
    if (this.preventDefault) {
      e.preventDefault()
    }
    this.onChanged.emit(this)
  }
  /**
   * Updates the state from given `touchend` event
   */
  private handleTouchEnd(e: TouchEvent) {
    let list = e.changedTouches
    for (let i = 0; i < list.length; i++) {
      this.touches.delete(list[i].identifier)
    }
    if (this.preventDefault) {
      e.preventDefault()
    }
    this.onChanged.emit(this)
  }

  public static getX(t: Touch): number {
    if ('getBoundingClientRect' in t.target) {
      const r = (t.target as HTMLElement).getBoundingClientRect()
      return t.clientX - r.left
    }
    return t.clientX
  }

  public static getY(t: Touch): number {
    if ('getBoundingClientRect' in t.target) {
      const r = (t.target as HTMLElement).getBoundingClientRect()
      return t.clientY - r.top
    }
    return t.clientY
  }
}
