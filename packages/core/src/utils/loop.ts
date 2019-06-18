/**
 * Gets the current timestamp. Uses performance.now() if available.
 *
 * @public
 */
export const getTime: () => number = (() => {
  let result = () => new Date().getTime()
  if (window['mozAnimationStartTime']) {
    result = () => window['mozAnimationStartTime']()
  }
  if (window.performance && typeof window.performance.now === 'function') {
    result = () => window.performance.now()
  }
  return result
})()

const raf: (cb: any) => void =
  window['requestAnimationFrame'] ||
  window['mozRequestAnimationFrame'] ||
  window['webkitRequestAnimationFrame'] ||
  window['msRequestAnimationFrame']

/**
 * @public
 */
export const requestFrame = typeof raf === 'function'
  ? (callback: any) => raf(callback)
  : (callback: any) => self.setTimeout(callback, 1)

/**
 * @public
 */
export interface Loop {
  kill(): void
  (): void
}

/**
 * @public
 */
export function loop(loopFunc: (...arg: any[]) => any): Loop {
  let time = getTime()
  let tick: any = () => {
    if (!tick) { return }
    let now = getTime()
    let dt = now - time
    time = now
    loopFunc(dt)
    if (!tick) { return }
    requestFrame(tick)
    return tick
  }
  tick.kill = () => { tick = null }
  return tick()
}
