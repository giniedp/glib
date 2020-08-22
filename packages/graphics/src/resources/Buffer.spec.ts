import { BufferType, BufferTypeOption, BufferUsage, BufferUsageOption, DeviceGL  } from '../index'
import { DataType } from '../enums'
import { BufferGL } from '../webgl'

describe('graphics/Buffer', () => {

  let device: DeviceGL

  beforeEach(() => {
    device = new DeviceGL({ context: 'webgl2' })
  })

  describe('constructor', () => {

    it ('sets usage', () => {
      if (!device.isWebGL2) {
        pending('webgl2 is not supported, skip webgl2 test')
        return
      }
      // default value
      expect(new BufferGL(device).usage).toBe(BufferUsage.Static);

      //
      ['Dynamic', 'DYNAMIC_DRAW', BufferUsage.Dynamic].forEach((usage: BufferUsageOption) => {
        let buffer = new BufferGL(device, { usage: usage })
        expect(buffer.usage).toBe(BufferUsage.Dynamic)
        expect(buffer.usageName).toBe('Dynamic')
      });

      ['Static', 'STATIC_DRAW', BufferUsage.Static].forEach((usage: BufferUsageOption) => {
        let buffer = new BufferGL(device, { usage: usage })
        expect(buffer.usage).toBe(BufferUsage.Static)
        expect(buffer.usageName).toBe('Static')
      });

      ['Stream', 'STREAM_DRAW', BufferUsage.Stream].forEach((usage: BufferUsageOption) => {
        let buffer = new BufferGL(device, { usage: usage })
        expect(buffer.usage).toBe(BufferUsage.Stream)
        expect(buffer.usageName).toBe('Stream')
      })
    })

    it ('sets type', () => {
      if (!device.isWebGL2) {
        pending('webgl2 is not supported, skip webgl2 test')
        return
      }
      // default value
      expect(new BufferGL(device).type).toBe(BufferType.IndexBuffer);

      ['IndexBuffer', 'ELEMENT_ARRAY_BUFFER', BufferType.IndexBuffer].forEach((it: BufferTypeOption) => {
        let buffer = new BufferGL(device, { type: it })
        expect(buffer.type).toBe(BufferType.IndexBuffer)
        expect(buffer.isIndexBuffer).toBe(true)
        expect(buffer.isVertexBuffer).toBe(false)
        expect(buffer.typeName).toBe('IndexBuffer')
      });

      ['VertexBuffer', 'ARRAY_BUFFER', BufferType.VertexBuffer].forEach((it: BufferTypeOption) => {
        let buffer = new BufferGL(device, {
          type: it,
          layout: {
            position: {
              elements: 3,
              offset: 0,
              type: DataType.float32,
            },
          },
        })
        expect(buffer.type).toBe(BufferType.VertexBuffer)
        expect(buffer.isIndexBuffer).toBe(false)
        expect(buffer.isVertexBuffer).toBe(true)
        expect(buffer.typeName).toBe('VertexBuffer')
      })
    })
  })

  describe('setData', () => {
    describe('uint16', () => {
      it ('sets the data', () => {
        if (!device.isWebGL2) {
          pending('webgl2 is not supported, skip webgl2 test')
          return
        }
        [
          [1, 2, 3, 4, 5, 6, 7, 8, 9],
          Uint16Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9]),
        ].forEach((data) => {
          let buffer = new BufferGL(device, {
            usage: 'Dynamic',
            type: 'IndexBuffer',
            dataType: 'uint16',
          })
          expect(buffer.stride).toBe(2)

          buffer.setData(data)
          expect(buffer.sizeInBytes).toBe(data.length * buffer.stride)

          let dst = new Uint16Array(10)
          buffer.getBufferSubData(0, dst, 0, 3)
          expect(Array.from(dst)).toEqual([1, 2, 3, 0, 0, 0, 0, 0, 0, 0])

          dst = new Uint16Array(10)
          buffer.getBufferSubData(0, dst, 3, 3)
          expect(Array.from(dst)).toEqual([0, 0, 0, 1, 2, 3, 0, 0, 0, 0])

          dst = new Uint16Array(10)
          buffer.getBufferSubData(3 * buffer.stride, dst, 3, 3)
          expect(Array.from(dst)).toEqual([0, 0, 0, 4, 5, 6, 0, 0, 0, 0])
        })
      })
    })
  })
})
