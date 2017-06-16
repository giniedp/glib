/**
 * Gets the current timestamp. Uses performance.now() if available.
 * @method getTime
 * @return {number}
 */
export const getTime: () => number = (() => {
  if (this.performance && this.performance.now) {
    return () => {
      return this.performance.now()
    }
  } else if (this['mozAnimationStartTime']) {
    return () => {
      return this['mozAnimationStartTime']
    }
  } else {
    return () => {
      return new Date().getTime()
    }
  }
})()

const raf: (cb: any) => void =
  this['requestAnimationFrame'] ||
  this['mozRequestAnimationFrame'] ||
  this['webkitRequestAnimationFrame'] ||
  this['msRequestAnimationFrame']

/**
 *
 * @method requestFrame
 */
export let requestFrame = (() => {
  if (typeof raf === 'function') {
    return (callback: any) => {
      raf(callback)
    }
  } else {
    return (callback: any) => {
      self.setTimeout(callback, 1)
    }
  }
})()

export interface Loop {
  kill(): void
  (): void
}

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
