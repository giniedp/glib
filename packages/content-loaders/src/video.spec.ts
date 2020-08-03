import {
  ContentManager,
  Pipeline,
} from '@gglib/content'

import {
  loadMp4ToHTMLVideoElement,
  loadWebmToHTMLVideoElement,
} from '@gglib/content-loaders'

import { DeviceGL } from '@gglib/graphics'

describe('content/loaders/native', () => {

  let device: DeviceGL
  let manager: ContentManager

  beforeEach(() => {
    device = new DeviceGL()
    manager = new ContentManager(device, {
      loader: new Pipeline(),
    })
  })

  describe('mp4ToHTMLVideoElement', () => {
    beforeEach(() => {
      manager.loader.register(loadMp4ToHTMLVideoElement)
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
      manager.loader.register(loadWebmToHTMLVideoElement)
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
