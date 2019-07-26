import { loop } from '@gglib/utils'

describe('@gglib/utils/utils/time', () => {
  describe('loop', () => {
    it ('calls a callback', (done) => {
      let t = 0
      let looper = loop((time, dt) => {
        t += dt
      })
      setTimeout(() => {
        looper.kill()
        expect(t > 0).toBe(true)
        done()
      }, 1000)
    })
  })
})
