import { Entity } from '@gglib/ecs'
import { LoopComponent } from './LoopComponent'
import { TimeComponent } from './TimeComponent'

describe('@gglib/ecs/LoopComponent', () => {

  let entity: Entity
  let looper: LoopComponent
  let timer: TimeComponent
  let mockedRealTime = 0
  let mockedAnimationFrame: () => void
  let targetElapsedTime = 16

  describe('fixed time step', () => {
    beforeEach(() => {
      looper = new LoopComponent({
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
      timer = new TimeComponent()
      entity = Entity.createRoot()
        .addComponent(looper)
        .addComponent(timer)
      mockedRealTime = 0
      entity.initializeComponents(true)

      expect(looper.isRunning).toBe(false)
      looper.run()
      expect(mockedAnimationFrame).not.toBe(null)
      expect(looper.isRunning).toBe(true)
    })

    afterEach(() => {
      expect(looper.isRunning).toBe(true)
      looper.stop()
      expect(mockedAnimationFrame).toBe(null)
      expect(looper.isRunning).toBe(false)
    })

    it('does not schedule updates until targetElapsedTime is not reached', () => {
      const spies = spyOn(timer, 'onUpdate').and.callThrough()

      mockedRealTime = 0
      mockedAnimationFrame()
      expect(timer.onUpdate).not.toHaveBeenCalled()
      spies.calls.reset()

      mockedRealTime = 8
      mockedAnimationFrame()
      expect(timer.onUpdate).not.toHaveBeenCalled()
      spies.calls.reset()

      mockedRealTime = 15
      mockedAnimationFrame()
      expect(timer.onUpdate).not.toHaveBeenCalled()
      spies.calls.reset()

      mockedRealTime = 16
      mockedAnimationFrame()
      expect(timer.onUpdate).toHaveBeenCalledTimes(1)
      spies.calls.reset()
    })

    it('schedules as many updates as they fit into time delta', () => {
      const spies = spyOn(timer, 'onUpdate').and.callThrough()

      mockedRealTime = 0
      mockedAnimationFrame()
      expect(timer.onUpdate).not.toHaveBeenCalled()
      spies.calls.reset()

      mockedRealTime += targetElapsedTime
      mockedAnimationFrame()
      expect(timer.onUpdate).toHaveBeenCalledTimes(1)
      spies.calls.reset()

      mockedRealTime += targetElapsedTime * 2
      mockedAnimationFrame()
      expect(timer.onUpdate).toHaveBeenCalledTimes(2)
      spies.calls.reset()

      mockedRealTime += targetElapsedTime * 8
      mockedAnimationFrame()
      expect(timer.onUpdate).toHaveBeenCalledTimes(8)
      spies.calls.reset()
    })

    it('limits schedules to maxElapsedTime', () => {
      const spies = spyOn(timer, 'onUpdate').and.callThrough()

      mockedRealTime = 0
      mockedAnimationFrame()
      expect(timer.onUpdate).not.toHaveBeenCalled()
      spies.calls.reset()

      mockedRealTime += targetElapsedTime * 8
      mockedAnimationFrame()
      expect(timer.onUpdate).toHaveBeenCalledTimes(8)
      spies.calls.reset()

      mockedRealTime += targetElapsedTime * 10
      mockedAnimationFrame()
      expect(timer.onUpdate).toHaveBeenCalledTimes(10)
      spies.calls.reset()

      mockedRealTime += targetElapsedTime * 11
      mockedAnimationFrame()
      expect(timer.onUpdate).toHaveBeenCalledTimes(10) // capped
      spies.calls.reset()

      mockedRealTime += targetElapsedTime * 12
      mockedAnimationFrame()
      expect(timer.onUpdate).toHaveBeenCalledTimes(10) // capped
      spies.calls.reset()
    })

    it('detects slow running loop', () => {

      mockedRealTime = 0

      mockedRealTime += targetElapsedTime
      mockedAnimationFrame()
      expect(looper.isRunningSlowly).toBe(false)

      mockedRealTime += targetElapsedTime * 4
      mockedAnimationFrame()
      expect(looper.isRunningSlowly).toBe(false) // 1 frame and 3 lagging frames

      mockedRealTime += targetElapsedTime * 2
      mockedAnimationFrame()
      expect(looper.isRunningSlowly).toBe(false) // 1 frame and 1 lagging frame => 4 lagging frames (ok)

      mockedRealTime += targetElapsedTime * 2
      mockedAnimationFrame()
      expect(looper.isRunningSlowly).toBe(true)  // 1 frame and 1 lagging frame => 5 lagging frames (exceeds maxLaggingFrames)

      mockedRealTime += targetElapsedTime
      mockedAnimationFrame()
      expect(looper.isRunningSlowly).toBe(true)  // reduced to 4 lagging frames

      mockedRealTime += targetElapsedTime
      mockedAnimationFrame()
      expect(looper.isRunningSlowly).toBe(true)  // reduced to 3 lagging frames

      mockedRealTime += targetElapsedTime
      mockedAnimationFrame()
      expect(looper.isRunningSlowly).toBe(true)  // reduced to 2 lagging frames

      mockedRealTime += targetElapsedTime
      mockedAnimationFrame()
      expect(looper.isRunningSlowly).toBe(true)  // reduced to 1 lagging frames

      mockedRealTime += targetElapsedTime
      mockedAnimationFrame()
      expect(looper.isRunningSlowly).toBe(false)  // reduced to 0 lagging frames
    })
  })
})
