import { eventSource, PointerLockApi } from '@gglib/utils'
import { MouseState, MouseStateProvider } from './MouseState'
import { MouseStateTransfer } from './MouseStateTransfer'

/**
 * Constructor options for {@link MouseListener}
 *
 * @public
 */
export interface MouseListenerOptions {
  /**
   * The target element where the events should be captured at. Defaults to `document.documentElement`
   */
  eventTarget?: EventTarget
  /**
   * The reference element that the pointer coordinates should be relative to.
   */
  captureTarget?: HTMLElement
  /**
   * List of events that are captured on the `eventTarget` and re-emitted on this instance
   */
  proxyEvents?: string[]
  /**
   * Whether the default action of any mouse event on captureTarget should be prevented. Defaults to `false`
   */
  preventDefault?: boolean
}

/**
 * Captures the mouse state.
 *
 * @remarks
 * The mouse events are captured at the given {@link MouseListenerOptions.eventTarget}. Using these events a mouse state
 * is recorded. On each recognized  state change the `changed` event is triggered.
 *
 * @public
 */
export class MouseListener implements MouseStateProvider {
  /**
   * The target eventTarget at which to listen for mouse events. Defaults to `document.documentElement`
   */
  public readonly eventTarget: EventTarget = document.documentElement

  /**
   * The reference element that the pointer coordinates should be relative to. Defaults to given `eventTarget` or `document`
   */
  public readonly captureTarget: HTMLElement = null

  /**
   * Whether the default action of any mouse event on captureTarget should be prevented.
   */
  public preventDefault: boolean = false

  /**
   * The current Mouse state
   */
  public readonly state: MouseState = {
    timestamp: 0,
    x: 0,
    y: 0,
    xNormalized: 0,
    yNormalized: 0,
    wheel: 0,
    buttons: 0,
  }

  public readonly transfer = new MouseStateTransfer({ type: 'sender' })

  /**
   * Listener that issues a clear state operation on this instance
   */
  protected readonly onClearStateListener: EventListener = this.onClearState.bind(this)
  /**
   * Listener that issues a clear state operation on this instance
   */
  protected readonly onCaptureStateListener: EventListener = this.onCaptureState.bind(this)
  /**
   *
   */
  protected readonly lockApi = new PointerLockApi()

  /**
   * Initializes the Mouse with given options and activates the capture listeners
   */
  constructor(options?: MouseListenerOptions) {
    this.setup(options)
  }

  /**
   * Re-initializes this instance. Can be used to switch eventTarget on the fly
   */
  public setup(options?: MouseListenerOptions) {
    this.deactivate()
    Object.assign<MouseListener, Partial<MouseListener>>(this, {
      eventTarget: options?.eventTarget ?? this.eventTarget,
      captureTarget: options?.captureTarget ?? this.captureTarget,
      preventDefault: options?.preventDefault ?? this.preventDefault,
    })
    this.activate()
  }

  /**
   * Activates the capture listeners
   */
  public activate() {
    this.deactivate()
    // update state events
    this.eventTarget.addEventListener('wheel', this.onCaptureStateListener, { passive: !this.preventDefault })
    this.eventTarget.addEventListener('mousemove', this.onCaptureStateListener)
    this.eventTarget.addEventListener('mousedown', this.onCaptureStateListener)
    this.eventTarget.addEventListener('mouseup', this.onCaptureStateListener)
  }

  /**
   * Deactivates the capture listeners
   */
  public deactivate() {
    // update logic events
    this.eventTarget.removeEventListener('wheel', this.onCaptureStateListener)
    this.eventTarget.removeEventListener('mousemove', this.onCaptureStateListener)
    this.eventTarget.removeEventListener('mousedown', this.onCaptureStateListener)
    this.eventTarget.removeEventListener('mouseup', this.onCaptureStateListener)
  }

  /**
   * Convenience method. Simply calls {@link MouseListener.deactivate}
   */
  public dispose() {
    this.deactivate()
  }

  public getState(out?: Partial<MouseState>): MouseState
  /**
   * Gets a copy of the captured state
   */
  public getState(out: MouseState = {} as any): MouseState {
    out.timestamp = this.state.timestamp
    out.x = this.state.x
    out.y = this.state.y
    out.xNormalized = this.state.xNormalized
    out.yNormalized = this.state.yNormalized
    out.wheel = this.state.wheel
    out.buttons = this.state.buttons
    return out
  }

  /**
   * Locks the mouse to the current element.
   *
   * @remarks
   * Mouse cursor will be invisible and only the `movementX` and `movementY` state properties are updated.
   */
  public lock() {
    if (!this.lockApi.isSupported) {
      console.warn('[Mouse] pointerlock api is not available')
      return
    }
    if (this.eventTarget === this.lockApi.pointerLockElement) {
      return
    }
    if (this.eventTarget instanceof Element) {
      this.lockApi.requestLock(this.captureTarget || this.eventTarget)
    } else {
      console.warn('[Mouse] lock() is only available for elements of type "Element"')
    }
  }
  /**
   * Checks for an active mouse lock in the document
   *
   * @returns true if any document element has a mouse lock
   */
  public get isLocked(): boolean {
    return !!this.lockApi.pointerLockElement
  }
  /**
   * Releases the active mouse lock in the document
   */
  public unlock() {
    this.lockApi.exitLock()
  }

  /**
   * Adds a callback that is call on 'changed' event
   *
   * @param fn - the callback function
   */
  public onChanged = eventSource<MouseListener>()

  protected onCaptureState(event: Event) {
    const e = event as MouseEvent
    if (this.preventDefault && e.target === this.captureTarget) {
      e.preventDefault()
    }
    this.state.timestamp = performance.now()
    this.capturePointer(e, this.state)
    this.captureButtons(e, this.state)
    this.captureWheel(e, this.state)
    this.transfer.setState(this.state)
    this.onChanged.emit(this)
  }

  protected capturePointer(e: MouseEvent, state: MouseState) {
    const client = this.captureTarget || this.eventTarget
    if (this.isLocked) {
      state.x += e.movementX
      state.y += e.movementY
    } else if (client instanceof HTMLElement) {
      const rect = client.getBoundingClientRect()
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      state.x = e.pageX - (rect.left + scrollLeft)
      state.y = e.pageY - (rect.top + scrollTop)
    }
    if (client instanceof HTMLElement) {
      state.xNormalized = state.x / client.clientWidth
      state.yNormalized = state.y / client.clientHeight
    }
  }

  protected captureButtons(e: MouseEvent, state: MouseState) {
    state.buttons = e.buttons
  }

  protected captureWheel(e: MouseEvent, state: MouseState) {
    state.wheel = state.wheel || 0
    if (e.type === 'wheel') {
      if (e.detail) {
        state.wheel += -1 * e.detail
      } else if ((e as any)['deltaY']) {
        state.wheel += (e as any)['deltaY'] / 120
      } else {
        state.wheel += 0
      }
    }
  }

  /**
   * Clears the tracked state
   */
  protected onClearState() {
    this.state.wheel = 0
    this.state.buttons = 0
    this.transfer.setState(this.state)
    this.onChanged.emit(this)
  }
}
