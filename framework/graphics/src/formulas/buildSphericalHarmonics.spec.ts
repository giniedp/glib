import { Manager } from '@glib/content'
import { buildSphericalHarmonics, Device, ModelBuilder } from '@glib/graphics'

describe('@glib/graphics/formulas', () => {
  describe('buildSphericalHarmonics', () => {
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
      buildSphericalHarmonics(builder)
      expect(builder.vertexCount).not.toBe(0)
    })
  })
})
