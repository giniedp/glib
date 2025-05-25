import { describe, expect, it } from 'vitest'
import { loop } from './loop'

describe('@gglib/utils/utils/time', () => {
  describe('loop', () => {
    it('calls a callback', async () => {
      let t = 0
      await new Promise<void>((resolve) => {
        const looper = loop((time, dt) => {
          t += dt
          looper.stop()
          resolve()
        })
      })
      expect(t > 0).toBe(true)
    })
  })
})
