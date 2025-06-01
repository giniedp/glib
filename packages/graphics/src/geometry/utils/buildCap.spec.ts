import { beforeEach, describe, expect, it } from 'vitest'
import { GeometryBuilder } from '../GeometryBuilder'
import { buildCap } from './buildCap'

describe('@gglib/graphics/formulas', () => {
  describe('buildCap', () => {
    let builder: GeometryBuilder

    beforeEach(() => {
      builder = new GeometryBuilder()
    })

    it('builds without errors', () => {
      expect(builder.vertexCount).toBe(0)
      buildCap(builder)
      expect(builder.vertexCount).not.toBe(0)
    })
  })
})
