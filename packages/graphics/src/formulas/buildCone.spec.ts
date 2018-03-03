import { Manager } from '@gglib/content'
import { buildCone, Device, ModelBuilder } from '@gglib/graphics'

describe('@gglib/graphics/formulas', () => {
  describe('buildCone', () => {
    let device: Device
    let manager: Manager
    let builder: ModelBuilder

    beforeEach(() => {
      device = new Device()
      manager = new Manager(device)
      builder = new ModelBuilder()
    })

    it ('builds without errors', () => {
      expect(builder.vertexCount).toBe(0)
      buildCone(builder)
      expect(builder.vertexCount).not.toBe(0)
    })
  })
})
