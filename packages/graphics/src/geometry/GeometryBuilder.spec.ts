import { describe, expect, it } from 'vitest'
import { Color } from '../Color'
import { BufferOptions, PlainBufferData } from '../resources'
import { GeometryBuilder } from './GeometryBuilder'

describe('Graphics.GeometryBuilder', () => {
  let builder: GeometryBuilder

  describe('addVertex', () => {
    it('adds vertex data', () => {
      builder = new GeometryBuilder({
        layout: [['position', 'normal', 'color']],
      })
      const buffer = builder.vertexBuffer[0] as BufferOptions<PlainBufferData>

      builder.addVertex({
        position: [1, 1, 0],
        normal: [0, 0, 1],
        color: [Color.Red.toPackedRGBA()],
      })
      // prettier-ignore
      expect(buffer.data.elements).toEqual([
        1, 1, 0,
        0, 0, 1,
        Color.Red.toPackedRGBA()
      ])

      builder.addVertex({
        position: [1, -1, 0],
        normal: [0, 0, 1],
        color: [Color.Green.toPackedRGBA()],
      })
      // prettier-ignore
      expect(buffer.data.elements).toEqual([
        1, 1, 0,
        0, 0, 1,
        Color.Red.toPackedRGBA(),

        1, -1, 0,
        0, 0, 1,
        Color.Green.toPackedRGBA()
      ])

      builder.addVertex({
        position: [-1, 1, 0],
        normal: [0, 0, 1],
        color: [Color.Blue.toPackedRGBA()],
      })
      // prettier-ignore
      expect(buffer.data.elements).toEqual([
        1, 1, 0,
        0, 0, 1,
        Color.Red.toPackedRGBA(),

        1, -1, 0,
        0, 0, 1,
        Color.Green.toPackedRGBA(),

        -1, 1, 0,
        0, 0, 1,
        Color.Blue.toPackedRGBA()
      ])

      builder.addVertex({
        position: [-1, -1, 0],
        normal: [0, 0, 1],
        color: [Color.White.toPackedRGBA()],
      })
      // prettier-ignore
      expect(buffer.data.elements).toEqual([
        1, 1, 0,
        0, 0, 1,
        Color.Red.toPackedRGBA(),

        1, -1, 0,
        0, 0, 1,
        Color.Green.toPackedRGBA(),

        -1, 1, 0,
        0, 0, 1,
        Color.Blue.toPackedRGBA(),

        -1, -1, 0,
        0, 0, 1,
        Color.White.toPackedRGBA()
      ])
    })
  })
})
