import { buildSphere, Device, ModelBuilder } from '@gglib/graphics'

describe('@gglib/graphics/formulas', () => {
  describe('buildSphere', () => {
    let device: Device
    let builder: ModelBuilder

    beforeEach(() => {
      device = new Device()
      builder = new ModelBuilder()
    })

    it ('builds without errors', () => {
      expect(builder.vertexCount).toBe(0)
      buildSphere(builder)
      expect(builder.vertexCount).not.toBe(0)
    })
  })
})
