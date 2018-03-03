import { WebWorker } from '@gglib/core'

describe('@gglib/core/WebWorker', () => {
  describe('.enable', () => {
    afterAll(() => {
      WebWorker.disable()
    })

    it('enabled web worker', () => {
      WebWorker.enable('')
      expect(WebWorker.count()).toBe(1)
      WebWorker.enable('', 10)
      expect(WebWorker.count()).toBe(10)
      WebWorker.enable('', 0)
      expect(WebWorker.count()).toBe(0)
    })
  })

  describe('register and execute', () => {
    it('calls registered method', (done) => {
      let wasCalled = false
      WebWorker.register('my-method', () => {
        wasCalled = true
      })
      expect(wasCalled).toBe(false)
      WebWorker.execute('my-method').then(() => {
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
