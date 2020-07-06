import { buildMobiusStrip, ModelBuilder } from '@gglib/graphics'

describe('@gglib/graphics/formulas', () => {
  describe('buildMobiusStrip', () => {
    let builder: ModelBuilder

    beforeEach(() => {
      builder = new ModelBuilder()
    })

    it ('builds without errors', () => {
      expect(builder.vertexCount).toBe(0)
      buildMobiusStrip(builder)
      expect(builder.vertexCount).not.toBe(0)
    })
  })
})
