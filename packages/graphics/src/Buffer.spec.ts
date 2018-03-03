import { Buffer, BufferType, BufferTypeOption, BufferUsage, BufferUsageOption, Device  } from '@gglib/graphics'

describe('graphics/Buffer', () => {

  let device: Device

  beforeEach(() => {
    device = new Device({ context: 'webgl2' })
  })

  describe('constructor', () => {

    it ('sets usage', () => {
      if (!device.isWebGL2) {
        pending('webgl2 is not supported, skip webgl2 test')
        return
      }
      // default value
      expect(new Buffer(device).usage).toBe(BufferUsage.Static);

      //
      ['Dynamic', 'DYNAMIC_DRAW', BufferUsage.Dynamic].forEach((usage: BufferUsageOption) => {
        let buffer = new Buffer(device, { usage: usage })
        expect(buffer.usage).toBe(BufferUsage.Dynamic)
        expect(buffer.usageName).toBe('DYNAMIC_DRAW')
      });

      ['Static', 'STATIC_DRAW', BufferUsage.Static].forEach((usage: BufferUsageOption) => {
        let buffer = new Buffer(device, { usage: usage })
        expect(buffer.usage).toBe(BufferUsage.Static)
        expect(buffer.usageName).toBe('STATIC_DRAW')
      });

      ['Stream', 'STREAM_DRAW', BufferUsage.Stream].forEach((usage: BufferUsageOption) => {
        let buffer = new Buffer(device, { usage: usage })
        expect(buffer.usage).toBe(BufferUsage.Stream)
        expect(buffer.usageName).toBe('STREAM_DRAW')
      })
    })

    it ('sets type', () => {
      if (!device.isWebGL2) {
        pending('webgl2 is not supported, skip webgl2 test')
        return
      }
      // default value
      expect(new Buffer(device).type).toBe(BufferType.IndexBuffer);

      ['IndexBuffer', 'ELEMENT_ARRAY_BUFFER', BufferType.IndexBuffer].forEach((it: BufferTypeOption) => {
        let buffer = new Buffer(device, { type: it })
        expect(buffer.type).toBe(BufferType.IndexBuffer)
        expect(buffer.typeName).toBe('ELEMENT_ARRAY_BUFFER')
      });

      ['VertexBuffer', 'ARRAY_BUFFER', BufferType.VertexBuffer].forEach((it: BufferTypeOption) => {
        let buffer = new Buffer(device, { type: it })
        expect(buffer.type).toBe(BufferType.VertexBuffer)
        expect(buffer.typeName).toBe('ARRAY_BUFFER')
      })
    })
  })

  describe('setData', () => {
    describe('ushort', () => {
      it ('sets the data', () => {
        if (!device.isWebGL2) {
          pending('webgl2 is not supported, skip webgl2 test')
          return
        }
        [
          [1, 2, 3, 4, 5, 6, 7, 8, 9],
          Uint16Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9]),
        ].forEach((data) => {
          let buffer = new Buffer(device, {
            usage: 'Dynamic',
            type: 'IndexBuffer',
            dataType: 'ushort',
          })
          expect(buffer.elementSize).toBe(2)
          expect(buffer.dataSize).toBe(0)

          buffer.setData(data)
          expect(buffer.dataSize).toBe(data.length * buffer.elementSize)

          let dst = new Uint16Array(10)
          buffer.getBufferSubData(0, dst, 0, 3)
          expect(Array.from(dst)).toEqual([1, 2, 3, 0, 0, 0, 0, 0, 0, 0])

          dst = new Uint16Array(10)
          buffer.getBufferSubData(0, dst, 3, 3)
          expect(Array.from(dst)).toEqual([0, 0, 0, 1, 2, 3, 0, 0, 0, 0])

          dst = new Uint16Array(10)
          buffer.getBufferSubData(3 * buffer.elementSize, dst, 3, 3)
          expect(Array.from(dst)).toEqual([0, 0, 0, 4, 5, 6, 0, 0, 0, 0])
        })
      })
    })
  })
})
