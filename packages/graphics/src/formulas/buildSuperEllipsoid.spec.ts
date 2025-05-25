import { beforeEach, describe, expect, it } from 'vitest'
import { GeometryBuilder } from '../model/GeometryBuilder'
import { buildSuperEllipsoid } from './buildSuperEllipsoid'

describe('@gglib/graphics/formulas', () => {
  describe('buildSuperEllipsoid', () => {
    let builder: GeometryBuilder

    beforeEach(() => {
      builder = new GeometryBuilder()
    })

    it('builds without errors', () => {
      expect(builder.vertexCount).toBe(0)
      buildSuperEllipsoid(builder)
      expect(builder.vertexCount).not.toBe(0)
    })
  })
})
