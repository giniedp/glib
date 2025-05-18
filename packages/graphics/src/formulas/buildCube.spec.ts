import { buildCube, GeometryBuilder } from '../index'

describe('@gglib/graphics/formulas', () => {
  describe('buildCube', () => {
    let builder: GeometryBuilder

    beforeEach(() => {
      builder = new GeometryBuilder()
    })

    it ('builds without errors', () => {
      expect(builder.vertexCount).toBe(0)
      buildCube(builder)
      expect(builder.vertexCount).not.toBe(0)
    })
  })
})
