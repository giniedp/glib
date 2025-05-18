import { buildIcosahedron, buildOctahedron, buildTetrahedron, GeometryBuilder } from '../index'

describe('@gglib/graphics/formulas', () => {
  describe('buildIcosahedron', () => {
    let builder: GeometryBuilder

    beforeEach(() => {
      builder = new GeometryBuilder()
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
