import { loop } from '@gglib/utils'

describe('@gglib/utils/utils/time', () => {
  describe('loop', () => {
    it ('calls a callback', (done) => {
      let time = 0
      let looper = loop((dt) => {
        time += dt
      })
      setTimeout(() => {
        looper.kill()
        expect(time > 0).toBe(true)
        done()
      }, 1000)
    })
  })
})
