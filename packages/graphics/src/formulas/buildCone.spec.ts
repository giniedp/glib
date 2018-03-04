import { buildCone, Device, ModelBuilder } from '@gglib/graphics'

describe('@gglib/graphics/formulas', () => {
  describe('buildCone', () => {
    let device: Device
    let builder: ModelBuilder

    beforeEach(() => {
      device = new Device()
      builder = new ModelBuilder()
    })

    it ('builds without errors', () => {
      expect(builder.vertexCount).toBe(0)
      buildCone(builder)
      expect(builder.vertexCount).not.toBe(0)
    })
  })
})
