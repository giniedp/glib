import { getImageData } from './getImageData'
import { describe, expect, it, beforeEach } from 'vitest'

describe('@gglib/utils/utils', () => {
  // tslint:disable-next-line
  const RED10x20 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAUCAYAAAC07qxWAAAAGElEQVR42mP8z8AARIQB46jCUYWjCkEAAMXUJ+1sUc+CAAAAAElFTkSuQmCC'

  describe('getImageData', () => {
    it ('gets the image data', async (done) => {

      const img = new Image()
      await new Promise<void>((resolve) => {
        img.onload = () => {
          const data = getImageData(img)
          expect(data.length).toBe(10 * 20)
          resolve()
        }
      })
      img.src = RED10x20
    })

    it ('throws an error if image is not complete', () => {
      expect(() => {
        getImageData({ complete: false } as any)
      }).toThrow()
    })
  })
})
