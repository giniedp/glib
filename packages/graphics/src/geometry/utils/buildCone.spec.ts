import { beforeEach, describe, expect, it } from 'vitest'
import { GeometryBuilder } from '../GeometryBuilder'
import { buildCone } from './buildCone'

describe('@gglib/graphics/formulas', () => {
  describe('buildCone', () => {
    let builder: GeometryBuilder

    beforeEach(() => {
      builder = new GeometryBuilder()
    })

    it('builds without errors', () => {
      expect(builder.vertexCount).toBe(0)
      buildCone(builder)
      expect(builder.vertexCount).not.toBe(0)
    })
  })
})
