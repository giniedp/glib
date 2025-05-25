import { afterAll, describe, expect, it } from 'vitest'
import { WebWorker } from './WebWorker'

describe('@gglib/utils/WebWorker', () => {
  afterAll(() => {
    WebWorker.disable()
  })

  describe('register and execute', () => {
    it('calls registered method', async () => {
      let wasCalled = false
      WebWorker.task('my-method', () => {
        wasCalled = true
      })
      expect(wasCalled).toBe(false)
      await WebWorker.exec('my-method')
      expect(wasCalled).toBe(true)
    })
  })
})
