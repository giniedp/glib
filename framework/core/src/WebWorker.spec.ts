import { WebWorker } from '@glib/core'

describe('@glib/core/WebWorker', () => {
  describe('.enable', () => {
    it('enabled web worker', () => {
      pending()
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
