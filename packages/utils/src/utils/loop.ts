/**
 * A loop function that can be started and stopped
 *
 * @public
 */
export interface Loop {
  /**
   * Indicates if the loop is currently running
   */
  isRunning: boolean
  /**
   * Starts the loop, if not already running
   */
  start(): Loop
  /**
   * Stops the loop, if running
   */
  stop(): Loop
}

/**
 * Spins the given `update` function in a loop by utilizing `requestAnimationFrame`
 *
 * @public
 * @remarks
 * A primitive loop scheduler with no fixed time support or any optimizations.
 * Simply schedules the given `update` function with `requestAnimationFrame`.
 */
export function loop(frame: (timestamp: number, dt: number) => any, autostart = true): Loop {
  let requestId: number = null
  let timestamp: number = performance.now()

  function tick() {
    const dt = performance.now() - timestamp
    timestamp += dt
    frame(timestamp, dt)
    requestId = requestAnimationFrame(tick)
  }

  function start() {
    if (requestId == null) {
      timestamp = performance.now()
      requestId = requestAnimationFrame(tick)
    }

    return looper
  }

  function stop() {
    if (requestId != null) {
      cancelAnimationFrame(requestId)
      requestId = null
    }
    return looper
  }

  const looper = {
    start,
    stop,
    get isRunning() {
      return requestId != null
    },
  }
  if (autostart) {
    looper.start()
  }
  return looper
}
