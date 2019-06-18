import { WebWorker } from '@gglib/core'

describe('@gglib/core/WebWorker', () => {
  describe('.enable', () => {
    afterAll(() => {
      WebWorker.disable()
    })

  })

  describe('register and execute', () => {
    it('calls registered method', (done) => {
      let wasCalled = false
      WebWorker.task('my-method', () => {
        wasCalled = true
      })
      expect(wasCalled).toBe(false)
      WebWorker.exec('my-method').then(() => {
        expect(wasCalled).toBe(true)
        done()
      })
      .catch((e: any) => {
        fail(e)
        done()
      })
    })
  })
})
