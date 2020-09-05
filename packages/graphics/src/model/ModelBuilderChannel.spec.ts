import { DataType, dataTypeSize } from '../enums'
import { ModelBuilderChannel, ModelBuilderChannelMap } from './ModelBuilderChannel'
import { BufferOptions } from '../resources'

describe('Graphics.ModelBuilderChannel', () => {
  let channels: ModelBuilderChannelMap
  let buffers: Array<BufferOptions<number[]>>

  beforeEach(() => {
    buffers = [{
      data: [
        11, 12, 13, 14, 15, 16,
        21, 22, 23, 24, 25, 26,
        31, 32, 33, 34, 35, 36,
      ],
      layout: {
        position: {
          elements: 3,
          normalize: false,
          offset: 0,
          packed: false,
          type: DataType.float,
        },
        normal: {
          elements: 3,
          normalize: false,
          offset: 3 * dataTypeSize(DataType.float),
          packed: false,
          type: DataType.float,
        },
      },
    }, {
      data: [
        17, 18,
        27, 28,
        37, 38,
      ],
      layout: {
        texture: {
          elements: 2,
          normalize: false,
          offset: 0,
          packed: false,
          type: DataType.float,
        },
      },
    }]
    channels = ModelBuilderChannel.fromVertexBuffer(buffers)
  })

  describe('#read', () => {
    it('position', () => {
      expect(channels.position.read(0, 0)).toBe(11)
      expect(channels.position.read(0, 1)).toBe(12)
      expect(channels.position.read(0, 2)).toBe(13)

      expect(channels.position.read(1, 0)).toBe(21)
      expect(channels.position.read(1, 1)).toBe(22)
      expect(channels.position.read(1, 2)).toBe(23)

      expect(channels.position.read(2, 0)).toBe(31)
      expect(channels.position.read(2, 1)).toBe(32)
      expect(channels.position.read(2, 2)).toBe(33)
    })

    it('normal', () => {
      expect(channels.normal.read(0, 0)).toBe(14)
      expect(channels.normal.read(0, 1)).toBe(15)
      expect(channels.normal.read(0, 2)).toBe(16)

      expect(channels.normal.read(1, 0)).toBe(24)
      expect(channels.normal.read(1, 1)).toBe(25)
      expect(channels.normal.read(1, 2)).toBe(26)

      expect(channels.normal.read(2, 0)).toBe(34)
      expect(channels.normal.read(2, 1)).toBe(35)
      expect(channels.normal.read(2, 2)).toBe(36)
    })

    it('texture', () => {
      expect(channels.texture.read(0, 0)).toBe(17)
      expect(channels.texture.read(0, 1)).toBe(18)

      expect(channels.texture.read(1, 0)).toBe(27)
      expect(channels.texture.read(1, 1)).toBe(28)

      expect(channels.texture.read(2, 0)).toBe(37)
      expect(channels.texture.read(2, 1)).toBe(38)
    })
  })

  describe('#readAttribute', () => {
    it('position', () => {
      expect(channels.position.readAttribute(0)).toEqual([11, 12, 13])
      expect(channels.position.readAttribute(1)).toEqual([21, 22, 23])
      expect(channels.position.readAttribute(2)).toEqual([31, 32, 33])
    })

    it('normal', () => {
      expect(channels.normal.readAttribute(0)).toEqual([14, 15, 16])
      expect(channels.normal.readAttribute(1)).toEqual([24, 25, 26])
      expect(channels.normal.readAttribute(2)).toEqual([34, 35, 36])
    })

    it('texture', () => {
      expect(channels.texture.readAttribute(0)).toEqual([17, 18])
      expect(channels.texture.readAttribute(1)).toEqual([27, 28])
      expect(channels.texture.readAttribute(2)).toEqual([37, 38])
    })
  })

  describe('#write', () => {
    it('position', () => {
      channels.position.write(0, 0, 41)
      channels.position.write(0, 1, 42)
      channels.position.write(0, 2, 43)

      expect(buffers[0].data).toEqual([
        41, 42, 43, 14, 15, 16,
        21, 22, 23, 24, 25, 26,
        31, 32, 33, 34, 35, 36,
      ])

      channels.position.write(1, 0, 51)
      channels.position.write(1, 1, 52)
      channels.position.write(1, 2, 53)

      expect(buffers[0].data).toEqual([
        41, 42, 43, 14, 15, 16,
        51, 52, 53, 24, 25, 26,
        31, 32, 33, 34, 35, 36,
      ])

      channels.position.write(2, 0, 61)
      channels.position.write(2, 1, 62)
      channels.position.write(2, 2, 63)

      expect(buffers[0].data).toEqual([
        41, 42, 43, 14, 15, 16,
        51, 52, 53, 24, 25, 26,
        61, 62, 63, 34, 35, 36,
      ])
    })

    it('normal', () => {
      channels.normal.write(0, 0, 44)
      channels.normal.write(0, 1, 45)
      channels.normal.write(0, 2, 46)

      expect(buffers[0].data).toEqual([
        11, 12, 13, 44, 45, 46,
        21, 22, 23, 24, 25, 26,
        31, 32, 33, 34, 35, 36,
      ])

      channels.normal.write(1, 0, 54)
      channels.normal.write(1, 1, 55)
      channels.normal.write(1, 2, 56)

      expect(buffers[0].data).toEqual([
        11, 12, 13, 44, 45, 46,
        21, 22, 23, 54, 55, 56,
        31, 32, 33, 34, 35, 36,
      ])

      channels.normal.write(2, 0, 64)
      channels.normal.write(2, 1, 65)
      channels.normal.write(2, 2, 66)

      expect(buffers[0].data).toEqual([
        11, 12, 13, 44, 45, 46,
        21, 22, 23, 54, 55, 56,
        31, 32, 33, 64, 65, 66,
      ])
    })

    it('texture', () => {
      channels.texture.write(0, 0, 47)
      channels.texture.write(0, 1, 48)

      expect(buffers[1].data).toEqual([
        47, 48,
        27, 28,
        37, 38,
      ])

      channels.texture.write(1, 0, 57)
      channels.texture.write(1, 1, 58)

      expect(buffers[1].data).toEqual([
        47, 48,
        57, 58,
        37, 38,
      ])

      channels.texture.write(2, 0, 67)
      channels.texture.write(2, 1, 68)

      expect(buffers[1].data).toEqual([
        47, 48,
        57, 58,
        67, 68,
      ])
    })
  })

  describe('#writeAttribute', () => {
    it('position', () => {
      channels.position.writeAttribute(0, [41, 42, 43])
      expect(buffers[0].data).toEqual([
        41, 42, 43, 14, 15, 16,
        21, 22, 23, 24, 25, 26,
        31, 32, 33, 34, 35, 36,
      ])

      channels.position.writeAttribute(1, [51, 52, 53])
      expect(buffers[0].data).toEqual([
        41, 42, 43, 14, 15, 16,
        51, 52, 53, 24, 25, 26,
        31, 32, 33, 34, 35, 36,
      ])

      channels.position.writeAttribute(2, [61, 62, 63])
      expect(buffers[0].data).toEqual([
        41, 42, 43, 14, 15, 16,
        51, 52, 53, 24, 25, 26,
        61, 62, 63, 34, 35, 36,
      ])
    })

    it('normal', () => {
      channels.normal.writeAttribute(0, [44, 45, 46])
      expect(buffers[0].data).toEqual([
        11, 12, 13, 44, 45, 46,
        21, 22, 23, 24, 25, 26,
        31, 32, 33, 34, 35, 36,
      ])

      channels.normal.writeAttribute(1, [54, 55, 56])
      expect(buffers[0].data).toEqual([
        11, 12, 13, 44, 45, 46,
        21, 22, 23, 54, 55, 56,
        31, 32, 33, 34, 35, 36,
      ])

      channels.normal.writeAttribute(2, [64, 65, 66])
      expect(buffers[0].data).toEqual([
        11, 12, 13, 44, 45, 46,
        21, 22, 23, 54, 55, 56,
        31, 32, 33, 64, 65, 66,
      ])
    })

    it('texture', () => {
      channels.texture.writeAttribute(0, [47, 48])
      expect(buffers[1].data).toEqual([
        47, 48,
        27, 28,
        37, 38,
      ])

      channels.texture.writeAttribute(1, [57, 58])
      expect(buffers[1].data).toEqual([
        47, 48,
        57, 58,
        37, 38,
      ])

      channels.texture.writeAttribute(2, [67, 68])
      expect(buffers[1].data).toEqual([
        47, 48,
        57, 58,
        67, 68,
      ])
    })
  })
})
