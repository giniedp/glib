import {
  Device,
  ParticleChannel,
  ParticleChannelOptions,
  Texture,
} from '@glib/graphics'

describe('graphics/ParticleChannel', () => {

  let device: Device

  beforeAll(() => {
    device = new Device({ context: 'webgl2' })
  })

  describe('constructor', () => {

    let channel: ParticleChannel

    beforeEach(() => {
      channel = new ParticleChannel(device, {
        maxParticles: 100,
      })
    })

    it ('creates vertexBuffer', () => {
      expect(channel.vertexBuffer).toBeDefined()
      expect(channel.vertexBuffer.elementCount).toBe(100 * 4)
    })

    it ('creates indexBuffer', () => {
      expect(channel.indexBuffer).toBeDefined()
      expect(channel.indexBuffer.elementCount).toBe(100 * 6)
    })

    it ('creates particles', () => {
      expect(channel.vertices).toBeDefined()
      expect(channel.vertices.stride).toBe(36)
    })

    it ('compiles the program', () => {
      expect(channel.program.linked).toBe(true)
    })

  })
})
