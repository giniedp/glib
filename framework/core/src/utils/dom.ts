function documentProperty(name: string) {
  return (document as any)[name]
}

let docHidden: string
let docVisibilityChange: string
let docVisibilityState: string
if (typeof documentProperty('hidden') !== 'undefined') { // Opera 12.10 and Firefox 18 and later support
  docHidden = 'hidden'
  docVisibilityState = 'visibilityState'
  docVisibilityChange = 'visibilitychange'
} else if (typeof documentProperty('mozHidden') !== 'undefined') {
  docHidden = 'mozHidden'
  docVisibilityState = 'mozVisibilityState'
  docVisibilityChange = 'mozvisibilitychange'
} else if (typeof documentProperty('msHidden') !== 'undefined') {
  docHidden = 'msHidden'
  docVisibilityState = 'msVisibilityState'
  docVisibilityChange = 'msvisibilitychange'
} else if (typeof documentProperty('webkitHidden') !== 'undefined') {
  docHidden = 'webkitHidden'
  docVisibilityState = 'webkitVisibilityState'
  docVisibilityChange = 'webkitvisibilitychange'
}

export function documentIsHidden(): boolean {
  return documentProperty(docHidden)
}
export function documentVisibilityState(fallback?: string): string {
  return documentProperty(docVisibilityState) || fallback
}
export function onDocumentVisibilityChange(callback: EventListenerOrEventListenerObject) {
  document.addEventListener(docVisibilityChange, callback)
}
export function offDocumentVisibilityChange(callback: EventListenerOrEventListenerObject) {
  document.removeEventListener(docVisibilityChange, callback)
}
