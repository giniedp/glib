export const isWorkerContext = typeof (globalThis as any)['importScripts'] === 'function'

/**
 * Determines whether this context is inside a browser window
 *
 * @public
 */
export const isWindowContext = typeof (globalThis as any)['importScripts'] !== 'function'

/**
 * Determines whether web porker api is supported
 *
 * @public
 */
export const isWorkerSupported = typeof Worker !== 'undefined'

/**
 * Gets the current worker context if available
 */
export function getWorkerContext() {
  if (isWorkerContext) {
    return globalThis as unknown as Worker
  }
  return null
}
