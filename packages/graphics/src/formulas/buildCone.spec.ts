import { buildCone, ModelBuilder } from '../index'

describe('@gglib/graphics/formulas', () => {
  describe('buildCone', () => {
    let builder: ModelBuilder

    beforeEach(() => {
      builder = new ModelBuilder()
    })

    it ('builds without errors', () => {
      expect(builder.vertexCount).toBe(0)
      buildCone(builder)
      expect(builder.vertexCount).not.toBe(0)
    })
  })
})
