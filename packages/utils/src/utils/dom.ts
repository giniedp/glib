function documentProperty(name: string) {
  return (document as any)[name]
}

const map = {
  def: {
    docHidden: 'hidden',
    docVisibilityState: 'visibilityState',
    docVisibilityChange: 'visibilitychange',
  },
  moz: {
    docHidden: 'mozHidden',
    docVisibilityState: 'mozVisibilityState',
    docVisibilityChange: 'mozvisibilitychange',
  },
  ms: {
    docHidden: 'msHidden',
    docVisibilityState: 'msVisibilityState',
    docVisibilityChange: 'msvisibilitychange',
  },
  webkit: {
    docHidden: 'webkitHidden',
    docVisibilityState: 'webkitVisibilityState',
    docVisibilityChange: 'webkitvisibilitychange',
  },
}

const props = (() => {
  if (typeof documentProperty('hidden') !== 'undefined') {
    return map.def
  } else if (typeof documentProperty('mozHidden') !== 'undefined') {
    return map.moz
  } else if (typeof documentProperty('msHidden') !== 'undefined') {
    return map.ms
  } else if (typeof documentProperty('webkitHidden') !== 'undefined') {
    return map.webkit
  }
})()

/**
 * Checks whether the current document is hidden.
 * See {@link https://developer.mozilla.org/en-US/docs/Web/API/Document/hidden | Document.hidden}
 *
 * @public
 */
export function documentIsHidden(): boolean {
  return documentProperty(props.docHidden)
}

/**
 * Gets the visibility state of current document.
 * See {@link https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilityState | Document.visibilityState}
 *
 * @public
 */
export function documentVisibilityState(fallback?: string): string {
  return documentProperty(props.docVisibilityState) || fallback
}

/**
 * Adds a listener to the
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Document/onvisibilitychange | Document.onvisibilitychange}
 * event
 *
 * @public
 */
export function onDocumentVisibilityChange(callback: EventListenerOrEventListenerObject) {
  document.addEventListener(props.docVisibilityChange, callback)
}

/**
 * Removes a listener from the
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Document/onvisibilitychange | Document.onvisibilitychange}
 * event
 *
 * @public
 */
export function offDocumentVisibilityChange(callback: EventListenerOrEventListenerObject) {
  document.removeEventListener(props.docVisibilityChange, callback)
}
