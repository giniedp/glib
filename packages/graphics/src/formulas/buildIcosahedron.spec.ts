import { buildIcosahedron, buildOctahedron, buildTetrahedron, Device, ModelBuilder } from '@gglib/graphics'

describe('@gglib/graphics/formulas', () => {
  describe('buildIcosahedron', () => {
    let device: Device
    let builder: ModelBuilder

    beforeEach(() => {
      device = new Device()
      builder = new ModelBuilder()
    })

    it ('builds without errors', () => {
      expect(builder.vertexCount).toBe(0)
      buildIcosahedron(builder, { tesselation: 1 })
      expect(builder.vertexCount).not.toBe(0)

      builder.reset()
      expect(builder.vertexCount).toBe(0)
      buildOctahedron(builder, { tesselation: 1 })
      expect(builder.vertexCount).not.toBe(0)

      builder.reset()
      expect(builder.vertexCount).toBe(0)
      buildTetrahedron(builder, { tesselation: 1 })
      expect(builder.vertexCount).not.toBe(0)
    })
  })
})
