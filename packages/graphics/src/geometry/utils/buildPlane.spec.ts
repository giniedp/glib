import { beforeEach, describe, expect, it } from 'vitest'
import { GeometryBuilder } from '../GeometryBuilder'
import { buildPlane } from './buildPlane'

describe('@gglib/graphics/formulas', () => {
  describe('buildPlane', () => {
    let builder: GeometryBuilder

    beforeEach(() => {
      builder = new GeometryBuilder()
    })

    it('builds without errors', () => {
      expect(builder.vertexCount).toBe(0)
      buildPlane(builder)
      expect(builder.vertexCount).not.toBe(0)
    })
  })
})
