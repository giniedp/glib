import { Manager } from '@gglib/content'
import { buildSuperEllipsoid, Device, ModelBuilder } from '@gglib/graphics'

describe('@gglib/graphics/formulas', () => {
  describe('buildSuperEllipsoid', () => {
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
      buildSuperEllipsoid(builder)
      expect(builder.vertexCount).not.toBe(0)
    })
  })
})
