import { loaders, Manager, Pipeline } from '@gglib/content'
import { Device } from '@gglib/graphics'

describe('content/loaders/native', () => {

  let device: Device
  let manager: Manager

  beforeEach(() => {
    device = new Device()
    manager = new Manager(device, {
      loader: new Pipeline(),
    })
  })

  describe('mp4ToHTMLVideoElement', () => {
    beforeEach(() => {
      manager.loader.register(loaders.mp4ToHTMLVideoElement)
    })

    it ('loads HTMLVideoElement', (done) => {
      manager.load('http://www.example.com/video.mp4', HTMLVideoElement).then((result) => {
        expect(result instanceof HTMLVideoElement).toBe(true)
        expect(result.src).toBe('http://www.example.com/video.mp4')
      })
      .catch(fail)
      .then(done)
    })
  })

  describe('pngToImageData', () => {
    beforeEach(() => {
      manager.loader.register(loaders.webmToHTMLVideoElement)
    })

    it ('loads HTMLVideoElement', (done) => {
      manager.load('http://www.example.com/video.webm', HTMLVideoElement).then((result) => {
        expect(result instanceof HTMLVideoElement).toBe(true)
        expect(result.src).toBe('http://www.example.com/video.webm')
      })
      .catch(fail)
      .then(done)
    })
  })
})
