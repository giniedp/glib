import { buildSphericalHarmonics, DeviceGL, GeometryBuilder } from '../index'

describe('@gglib/graphics/formulas', () => {
  describe('buildSphericalHarmonics', () => {
    let device: DeviceGL
    let builder: GeometryBuilder

    beforeEach(() => {
      device = new DeviceGL()
      builder = new GeometryBuilder()
    })

    it ('builds without errors', () => {
      expect(builder.vertexCount).toBe(0)
      buildSphericalHarmonics(builder)
      expect(builder.vertexCount).not.toBe(0)
    })
  })
})
