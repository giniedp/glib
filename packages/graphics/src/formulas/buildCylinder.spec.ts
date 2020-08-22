import { buildCylinder, ModelBuilder } from '../index'

describe('@gglib/graphics/formulas', () => {
  describe('buildCylinder', () => {
    let builder: ModelBuilder

    beforeEach(() => {
      builder = new ModelBuilder()
    })

    it ('builds without errors', () => {
      expect(builder.vertexCount).toBe(0)
      buildCylinder(builder)
      expect(builder.vertexCount).not.toBe(0)
    })
  })
})
