import { GameEntity } from '@gglib/ecs'
import { GameLoop } from './GameLoop'
import { describe, beforeEach, it, expect, afterEach, vi } from 'vitest'

describe('@gglib/ecs/LoopComponent', () => {
  let entity: GameEntity
  let loop: GameLoop
  let mockedRealTime = 0
  let mockedAnimationFrame: () => void
  let targetElapsedTime = 16


  describe('fixed time step', () => {
    beforeEach(() => {
      loop = new GameLoop({
        autostart: false,
        useFixedTimeStep: true,
        targetElapsedTime: targetElapsedTime,
        maxElapsedTime: targetElapsedTime * 10,
        maxLaggingFrames: 4,
        getTime: () => mockedRealTime,
        requestAnimationFrame: (cb: any) => {
          mockedAnimationFrame = cb
          return 0
        },
        cancelAnimationFrame: () => {
          mockedAnimationFrame = null
        },
      })

      entity = new GameEntity().provide(loop).initialize(null)

      mockedRealTime = 0

      expect(loop.isRunning).toBe(false)
      loop.run()
      expect(mockedAnimationFrame).not.toBe(null)
      expect(loop.isRunning).toBe(true)
    })

    afterEach(() => {
      expect(loop.isRunning).toBe(true)
      loop.stop()
      expect(mockedAnimationFrame).toBe(null)
      expect(loop.isRunning).toBe(false)
    })

    it('does not schedule updates until targetElapsedTime is not reached', () => {
      let updated = false
      loop.onUpdate.once(() => (updated = true))

      mockedRealTime = 0
      mockedAnimationFrame()
      expect(updated).toBe(false)
      updated = false

      mockedRealTime = 8
      mockedAnimationFrame()
      expect(updated).toBe(false)
      updated = false

      mockedRealTime = 15
      mockedAnimationFrame()
      expect(updated).toBe(false)
      updated = false

      mockedRealTime = 16
      mockedAnimationFrame()
      expect(updated).toBe(true)
      updated = false
    })

    it('schedules as many updates as they fit into time delta', () => {
      let count = 0
      loop.onUpdate.once(() => count++)

      mockedRealTime = 0
      mockedAnimationFrame()
      expect(count).toBe(false)

      mockedRealTime += targetElapsedTime
      mockedAnimationFrame()
      expect(count).toBe(1)
      count = 0

      mockedRealTime += targetElapsedTime * 2
      mockedAnimationFrame()
      expect(count).toBe(2)
      count = 0

      mockedRealTime += targetElapsedTime * 8
      mockedAnimationFrame()
      expect(count).toBe(8)
      count = 0
    })

    it('limits schedules to maxElapsedTime', () => {
      let count = 0
      loop.onUpdate.once(() => count++)

      mockedRealTime = 0
      mockedAnimationFrame()
      expect(count).toBe(0)

      mockedRealTime += targetElapsedTime * 8
      mockedAnimationFrame()
      expect(count).toBe(8)
      count = 0

      mockedRealTime += targetElapsedTime * 10
      mockedAnimationFrame()
      expect(count).toBe(10)
      count = 0

      mockedRealTime += targetElapsedTime * 11
      mockedAnimationFrame()
      expect(count).toBe(10) // capped
      count = 0

      mockedRealTime += targetElapsedTime * 12
      mockedAnimationFrame()
      expect(count).toBe(10) // capped
      count = 0
    })

    it('detects slow running loop', () => {
      mockedRealTime = 0

      mockedRealTime += targetElapsedTime
      mockedAnimationFrame()
      expect(loop.isRunningSlowly).toBe(false)

      mockedRealTime += targetElapsedTime * 4
      mockedAnimationFrame()
      expect(loop.isRunningSlowly).toBe(false) // 1 frame and 3 lagging frames

      mockedRealTime += targetElapsedTime * 2
      mockedAnimationFrame()
      expect(loop.isRunningSlowly).toBe(false) // 1 frame and 1 lagging frame => 4 lagging frames (ok)

      mockedRealTime += targetElapsedTime * 2
      mockedAnimationFrame()
      expect(loop.isRunningSlowly).toBe(true) // 1 frame and 1 lagging frame => 5 lagging frames (exceeds maxLaggingFrames)

      mockedRealTime += targetElapsedTime
      mockedAnimationFrame()
      expect(loop.isRunningSlowly).toBe(true) // reduced to 4 lagging frames

      mockedRealTime += targetElapsedTime
      mockedAnimationFrame()
      expect(loop.isRunningSlowly).toBe(true) // reduced to 3 lagging frames

      mockedRealTime += targetElapsedTime
      mockedAnimationFrame()
      expect(loop.isRunningSlowly).toBe(true) // reduced to 2 lagging frames

      mockedRealTime += targetElapsedTime
      mockedAnimationFrame()
      expect(loop.isRunningSlowly).toBe(true) // reduced to 1 lagging frames

      mockedRealTime += targetElapsedTime
      mockedAnimationFrame()
      expect(loop.isRunningSlowly).toBe(false) // reduced to 0 lagging frames
    })
  })
})
