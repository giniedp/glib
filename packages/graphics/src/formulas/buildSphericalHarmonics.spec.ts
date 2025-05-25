import { beforeEach, describe, expect, it } from 'vitest'
import { GeometryBuilder } from '../model/GeometryBuilder'
import { buildSphericalHarmonics } from './buildSphericalHarmonics'

describe('@gglib/graphics/formulas', () => {
  describe('buildSphericalHarmonics', () => {
    let builder: GeometryBuilder

    beforeEach(() => {
      builder = new GeometryBuilder()
    })

    it('builds without errors', () => {
      expect(builder.vertexCount).toBe(0)
      buildSphericalHarmonics(builder)
      expect(builder.vertexCount).not.toBe(0)
    })
  })
})
