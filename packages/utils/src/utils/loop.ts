/**
 * Gets the current timestamp. Uses performance.now() if available.
 *
 * @public
 */
export const getTime: () => number = (() => {
  if (window.performance && typeof window.performance.now === 'function') {
    return () => window.performance.now()
  }
  return () => Date.now()
})()

/**
 * Browsersafe {@link https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame | requestAnimationFrame }
 * function
 * @public
 */
export const requestAnimationFrame: (cb: FrameRequestCallback) => number =
  window['requestAnimationFrame'] ||
  window['mozRequestAnimationFrame'] ||
  window['webkitRequestAnimationFrame'] ||
  window['msRequestAnimationFrame'] ||
  ((cb) => setTimeout(() => cb(getTime())))

/**
 * Browsersafe {@link https://developer.mozilla.org/en-US/docs/Web/API/window/cancelAnimationFrame | cancelAnimationFrame }
 * function
 * @public
 */
export const cancelAnimationFrame: (requestId: number) => number =
  window['cancelAnimationFrame'] ||
  window['mozCancelAnimationFrame'] ||
  window['webkitCancelAnimationFrame'] ||
  window['msCancelAnimationFrame'] ||
  clearTimeout

/**
 * A loop function that can be started and killed
 *
 * @public
 */
export interface Loop {
  /**
   * Kills the loop
   */
  kill(): void
  /**
   * Starts the loop
   */
  (): void
}

/**
 * Spins the given `callback` in a loop by utilizing `requestAnimationFrame`
 *
 * @public
 */
export function loop(callback: (timestamp?: number, dt?: number) => any): Loop {
  let requestId: number = null
  let timestamp: number = getTime()
  const looper: any = () => {
    const dt = getTime() - timestamp
    cancelAnimationFrame(requestId)
    callback(timestamp, dt)
    timestamp += dt
    requestId = requestAnimationFrame(looper)
  }
  looper.kill = () => {
    cancelAnimationFrame(requestId)
  }
  looper()
  return looper
}
