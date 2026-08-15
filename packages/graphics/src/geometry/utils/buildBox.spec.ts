import { beforeEach, describe, expect, it } from 'vitest'
import { GeometryBuilder } from '../GeometryBuilder'
import { buildBox } from './buildBox'

describe('@gglib/graphics/formulas', () => {
  describe('buildCube', () => {
    let builder: GeometryBuilder

    beforeEach(() => {
      builder = new GeometryBuilder()
    })

    it('builds without errors', () => {
      expect(builder.vertexCount).toBe(0)
      buildBox(builder)
      expect(builder.vertexCount).not.toBe(0)
    })
  })
})
