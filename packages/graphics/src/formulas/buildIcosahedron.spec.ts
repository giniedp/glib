import { beforeEach, describe, expect, it } from 'vitest'
import { GeometryBuilder } from '../model/GeometryBuilder'
import { buildIcosahedron, buildOctahedron, buildTetrahedron } from './buildIcosahedron'

describe('@gglib/graphics/formulas', () => {
  describe('buildIcosahedron', () => {
    let builder: GeometryBuilder

    beforeEach(() => {
      builder = new GeometryBuilder()
    })

    it('builds without errors', () => {
      expect(builder.vertexCount).toBe(0)
      buildIcosahedron(builder)
      expect(builder.vertexCount).not.toBe(0)

      builder.reset()
      expect(builder.vertexCount).toBe(0)
      buildOctahedron(builder)
      expect(builder.vertexCount).not.toBe(0)

      builder.reset()
      expect(builder.vertexCount).toBe(0)
      buildTetrahedron(builder)
      expect(builder.vertexCount).not.toBe(0)
    })
  })
})
