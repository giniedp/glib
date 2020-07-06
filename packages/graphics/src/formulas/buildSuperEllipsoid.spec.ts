import { buildSuperEllipsoid, DeviceGL, ModelBuilder } from '@gglib/graphics'

describe('@gglib/graphics/formulas', () => {
  describe('buildSuperEllipsoid', () => {
    let device: DeviceGL
    let builder: ModelBuilder

    beforeEach(() => {
      device = new DeviceGL()
      builder = new ModelBuilder()
    })

    it ('builds without errors', () => {
      expect(builder.vertexCount).toBe(0)
      buildSuperEllipsoid(builder)
      expect(builder.vertexCount).not.toBe(0)
    })
  })
})
