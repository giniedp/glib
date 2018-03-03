import { Manager } from '@gglib/content'
import { Device, Texture, TextureType } from '@gglib/graphics'

describe('glib/content/manager/importer', () => {

  let device: Device
  let manager: Manager

  beforeEach(() => {
    device = new Device()
    manager = new Manager(device)
  })

  describe('Video', () => {
    it ('loads Video element', (done) => {
      manager.load(HTMLVideoElement, 'http://www.example.com/video.mp4').then((result) => {
        expect(result instanceof HTMLVideoElement).toBe(true)
        expect(result.src).toBe('http://www.example.com/video.mp4')
        done()
      }).catch((res) => {
        fail(res)
        done()
      })
    })
  })
})
