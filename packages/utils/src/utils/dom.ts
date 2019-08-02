import { getOption } from './get-option'

const vendors = ['', 'moz', 'webkit', 'ms', 'o']

export function vendorProperty<T extends Element | Document>(el: T, name: keyof T, ...variants: string[]): string {
  for (const prefix of vendors) {
    if (prefix) {
      const vendorName = prefix + name[0].toUpperCase() + String(name).substr(1)
      if (vendorName in el) {
        return vendorName
      }
    } else if (name in el) {
      return name.toString()
    }
  }
  for (const variant of variants) {
    if (variant in el) {
      return variant
    }
  }
  return null
}

export function vendorEvent<T extends Element | Document>(el: T, name: keyof T, ...variants: string[]): string {
  const suffix = name.toString().replace(/^on/, '')
  for (const prefix of vendors) {
    const event = 'on' + prefix + suffix
    if (event in el) {
      return event
    }
  }
  for (const variant of variants) {
    if (variant in el) {
      return variant
    }
  }
  return null
}

const docHidden = vendorProperty(document, 'hidden')
const docVisibilityState = vendorProperty(document, 'visibilityState')
const docVisibilityChange = vendorEvent(document, 'onvisibilitychange')

export const documentVisibilityApi = {
  /**
   * Checks whether the current document is hidden.
   * See {@link https://developer.mozilla.org/en-US/docs/Web/API/Document/hidden | Document.hidden}
   *
   * @public
   */
  get isHidden() {
    return getOption(document, docHidden as 'hidden', false)
  },
  /**
   * Checks whether the current document is hidden.
   * See {@link https://developer.mozilla.org/en-US/docs/Web/API/Document/hidden | Document.hidden}
   *
   * @public
   */
  get isVisible() {
    return getOption(document, docHidden as 'hidden', true)
  },
  /**
   * Gets the visibility state of current document.
   * See {@link https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilityState | Document.visibilityState}
   *
   * @public
   */
  get visibilityState(): VisibilityState {
    return getOption(document, docVisibilityState as 'visibilityState', 'visible')
  },
  /**
   * Adds a listener to the
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/Document/onvisibilitychange | Document.onvisibilitychange}
   * event
   *
   * @public
   */
  onVisibilityChange(callback: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
    if (docVisibilityChange) {
      document.addEventListener(docVisibilityChange, callback, options)
    }
  },
  /**
   * Removes a listener from the
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/Document/onvisibilitychange | Document.onvisibilitychange}
   * event
   *
   * @public
   */
  offVisibilityChange(callback: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
    if (docVisibilityChange) {
      document.removeEventListener(docVisibilityChange, callback, options)
    }
  },
}

export class PointerLockApi {

  private pointerlockchange = vendorEvent(document as any, 'pointerlockchange')
  private pointerlockerror = vendorEvent(document as any, 'pointerlockerror')
  private requestPointerLockName = vendorProperty(document as any, 'requestPointerLock')
  private exitPointerLockName = vendorProperty(document as any, 'exitPointerLock')
  private pointerLockElementName = vendorProperty(document as any, 'pointerLockElement')

  public get isSupported() {
    return !!this.exitPointerLockName
  }

  public get pointerLockElement() {
    return getOption(document, this.pointerLockElementName as any, null)
  }

  public onChange(callback: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
    if (this.pointerlockchange) {
      document.addEventListener(this.pointerlockchange, callback, options)
    }
  }
  public offChange(callback: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
    if (this.pointerlockchange) {
      document.removeEventListener(this.pointerlockchange, callback, options)
    }
  }

  public onError(callback: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
    if (this.pointerlockerror) {
      document.addEventListener(this.pointerlockerror, callback, options)
    }
  }
  public offError(callback: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
    if (this.pointerlockerror) {
      document.removeEventListener(this.pointerlockerror, callback, options)
    }
  }

  public requestLock(target: Element) {
    this.requestPointerLockName = this.requestPointerLockName || vendorProperty(target, 'requestPointerLock')
    if (this.requestPointerLockName) {
      target[this.requestPointerLockName]()
    }
  }

  public exitLock() {
    if (this.exitPointerLockName) {
      document[this.exitPointerLockName]()
    }
  }
}
