import { beforeEach, describe, expect, it } from 'vitest'
import { GeometryBuilder } from '../GeometryBuilder'
import { buildCylinder } from './buildCylinder'

describe('@gglib/graphics/formulas', () => {
  describe('buildCylinder', () => {
    let builder: GeometryBuilder

    beforeEach(() => {
      builder = new GeometryBuilder()
    })

    it('builds without errors', () => {
      expect(builder.vertexCount).toBe(0)
      buildCylinder(builder)
      expect(builder.vertexCount).not.toBe(0)
    })
  })
})
