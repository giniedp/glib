import { beforeEach, describe, expect, it } from 'vitest'
import { GeometryBuilder } from '../model/GeometryBuilder'
import { buildSphere } from './buildSphere'

describe('@gglib/graphics/formulas', () => {
  describe('buildSphere', () => {
    let builder: GeometryBuilder

    beforeEach(() => {
      builder = new GeometryBuilder()
    })

    it('builds without errors', () => {
      expect(builder.vertexCount).toBe(0)
      buildSphere(builder)
      expect(builder.vertexCount).not.toBe(0)
    })
  })
})
