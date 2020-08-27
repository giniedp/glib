import {
  ContentManager,
  Pipeline,
} from '@gglib/content'

import {
  loadMp4ToHTMLVideoElement,
  loadWebmToHTMLVideoElement,
} from './index'

import { DeviceGL } from '@gglib/graphics'

describe('content/loaders/native', () => {

  let device: DeviceGL
  let manager: ContentManager

  beforeEach(() => {
    device = new DeviceGL()
    manager = new ContentManager(device, {
      pipeline: new Pipeline(),
    })
  })

  describe('mp4ToHTMLVideoElement', () => {
    beforeEach(() => {
      manager.pipeline.register(loadMp4ToHTMLVideoElement)
    })

    it ('loads HTMLVideoElement', async () => {
      const result = await manager.load('http://www.example.com/video.mp4', HTMLVideoElement)
      expect(result instanceof HTMLVideoElement).toBe(true)
      expect(result.src).toBe('http://www.example.com/video.mp4')
    })
  })

  describe('pngToImageData', () => {
    beforeEach(() => {
      manager.pipeline.register(loadWebmToHTMLVideoElement)
    })

    it ('loads HTMLVideoElement', async () => {
      const result = await manager.load('http://www.example.com/video.webm', HTMLVideoElement)
      expect(result instanceof HTMLVideoElement).toBe(true)
      expect(result.src).toBe('http://www.example.com/video.webm')
    })
  })
})
