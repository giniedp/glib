import { buildSphere, ModelBuilder } from '../index'

describe('@gglib/graphics/formulas', () => {
  describe('buildSphere', () => {
    let builder: ModelBuilder

    beforeEach(() => {
      builder = new ModelBuilder()
    })

    it ('builds without errors', () => {
      expect(builder.vertexCount).toBe(0)
      buildSphere(builder)
      expect(builder.vertexCount).not.toBe(0)
    })
  })
})
