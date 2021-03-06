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

function withWindowBinding(...names: string[]) {
  for (const name of names) {
    if (name in window) {
      return window[name].bind(window)
    }
  }
  return null
}

/**
 * Browsersafe {@link https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame | requestAnimationFrame }
 * function
 * @public
 */
export const requestAnimationFrame: (cb: FrameRequestCallback) => number =
  withWindowBinding(
    'requestAnimationFrame',                     // prefer without wendor prefix
    'mozRequestAnimationFrame',                  // fallback to vendor prefix
    'webkitRequestAnimationFrame',
    'msRequestAnimationFrame',
  ) || ((cb) => setTimeout(() => cb(getTime()))) // no RAF support => usage with setTimeout

/**
 * Browsersafe {@link https://developer.mozilla.org/en-US/docs/Web/API/window/cancelAnimationFrame | cancelAnimationFrame }
 * function
 * @public
 */
export const cancelAnimationFrame: (requestId: number) => number = withWindowBinding(
  'cancelAnimationFrame',       // prefer without wendor prefix
  'mozCancelAnimationFrame',    // fallback to vendor prefix
  'webkitCancelAnimationFrame',
  'msCancelAnimationFrame',
  'clearTimeout',               // no RAF support => usage with setTimeout
)

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
 * Spins the given `update` function in a loop by utilizing `requestAnimationFrame`
 *
 * @public
 * @remarks
 * A primitive loop scheduler with no fixed time support or any optimizations.
 * Simply schedules the given `update` function with `requestAnimationFrame`.
 */
export function loop(update: (timestamp?: number, dt?: number) => any): Loop {
  let requestId: number = null
  let timestamp: number = getTime()

  function tick() {
    const dt = getTime() - timestamp
    timestamp += dt
    update(timestamp, dt)

    requestId = requestAnimationFrame(tick)
  }
  const looper = () => {
    if (requestId == null) {
      timestamp = getTime()
      requestId = requestAnimationFrame(tick)
    }
  }
  looper.kill = () => {
    if (requestId != null) {
      cancelAnimationFrame(requestId)
      requestId = null
    }
  }
  looper()

  return looper
}
