import { buildCube, ModelBuilder } from '@gglib/graphics'

describe('@gglib/graphics/formulas', () => {
  describe('buildCube', () => {
    let builder: ModelBuilder

    beforeEach(() => {
      builder = new ModelBuilder()
    })

    it ('builds without errors', () => {
      expect(builder.vertexCount).toBe(0)
      buildCube(builder)
      expect(builder.vertexCount).not.toBe(0)
    })
  })
})
