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
 * A primitive loop scheduler with no fixed time support or any optimizations.
 * Simply schedules the given `frame` function with `requestAnimationFrame`.
 *
 * @public
 */
export function loop(frame: (timeInMs: number, deltaInMs: number) => any, autostart = true): Loop {
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
