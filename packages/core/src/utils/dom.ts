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
 * @public
 */
export function documentIsHidden(): boolean {
  return documentProperty(props.docHidden)
}

/**
 * @public
 */
export function documentVisibilityState(fallback?: string): string {
  return documentProperty(props.docVisibilityState) || fallback
}

/**
 * @public
 */
export function onDocumentVisibilityChange(callback: EventListenerOrEventListenerObject) {
  document.addEventListener(props.docVisibilityChange, callback)
}

/**
 * @public
 */
export function offDocumentVisibilityChange(callback: EventListenerOrEventListenerObject) {
  document.removeEventListener(props.docVisibilityChange, callback)
}
