import { buildSphericalHarmonics, DeviceGL, ModelBuilder } from '../index'

describe('@gglib/graphics/formulas', () => {
  describe('buildSphericalHarmonics', () => {
    let device: DeviceGL
    let builder: ModelBuilder

    beforeEach(() => {
      device = new DeviceGL()
      builder = new ModelBuilder()
    })

    it ('builds without errors', () => {
      expect(builder.vertexCount).toBe(0)
      buildSphericalHarmonics(builder)
      expect(builder.vertexCount).not.toBe(0)
    })
  })
})
