import { beforeEach, describe, expect, it } from 'vitest'
import { GeometryBuilder } from '../model/GeometryBuilder'
import { buildMobiusStrip } from './buildMobiusStrip'

describe('@gglib/graphics/formulas', () => {
  describe('buildMobiusStrip', () => {
    let builder: GeometryBuilder

    beforeEach(() => {
      builder = new GeometryBuilder()
    })

    it('builds without errors', () => {
      expect(builder.vertexCount).toBe(0)
      buildMobiusStrip(builder)
      expect(builder.vertexCount).not.toBe(0)
    })
  })
})
