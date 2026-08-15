import { describe, expect, it, vi } from 'vitest'
import type { Mat4 } from '@gglib/math'
import { BufferRecorder } from './BufferRecorder'
import type { Buffer, BufferField } from '../resources'

function createGpuBuffer(size: number) {
  return {
    size,
    setData: vi.fn(),
    setSubData: vi.fn(),
  } as unknown as Buffer & { setData: ReturnType<typeof vi.fn>; setSubData: ReturnType<typeof vi.fn> }
}

describe('BufferRecorder', () => {
  describe('constructor', () => {
    it('throws if recordByteSize is not a multiple of 4', () => {
      expect(() => new BufferRecorder({ capacity: 1, autosize: false, recordByteSize: 3 })).toThrow()
    })

    it('throws if recordByteSize is <= 0', () => {
      expect(() => new BufferRecorder({ capacity: 1, autosize: false, recordByteSize: 0 })).toThrow()
    })

    it('throws if capacity is <= 0', () => {
      expect(() => new BufferRecorder({ capacity: 0, autosize: false, recordByteSize: 4 })).toThrow()
    })

    it('initializes properties from options', () => {
      const rec = new BufferRecorder({ capacity: 4, autosize: true, recordByteSize: 16 })
      expect(rec.capacity).toBe(4)
      expect(rec.autosize).toBe(true)
      expect(rec.strideInBytes).toBe(16)
      expect(rec.strideInElements).toBe(4)
      expect(rec.count).toBe(0)
      expect(rec.recordIndex).toBe(0)
      expect(rec.buffer.byteLength).toBe(64)
      expect(rec.dataFloat32.length).toBe(16)
      expect(rec.dataInt32.length).toBe(16)
      expect(rec.dataUint32.length).toBe(16)
    })
  })

  describe('remainingRecordCount', () => {
    it('returns capacity minus recordIndex', () => {
      const rec = new BufferRecorder({ capacity: 5, autosize: false, recordByteSize: 4 })
      expect(rec.remainingRecordCount).toBe(5)
      rec.seek(2)
      expect(rec.remainingRecordCount).toBe(3)
    })
  })

  describe('isDirty / resetDirty', () => {
    it('is not dirty initially', () => {
      const rec = new BufferRecorder({ capacity: 2, autosize: false, recordByteSize: 16 })
      expect(rec.isDirty).toBe(false)
    })

    it('becomes dirty after a write and stays dirty once the cursor moves on', () => {
      const rec = new BufferRecorder({ capacity: 2, autosize: false, recordByteSize: 16 })
      rec.writeFloat32x4(1, 2, 3, 4)
      expect(rec.isDirty).toBe(true)
      rec.seek(1)
      expect(rec.isDirty).toBe(true)
    })

    it('clears dirty state with resetDirty once the cursor has settled', () => {
      const rec = new BufferRecorder({ capacity: 2, autosize: false, recordByteSize: 16 })
      rec.writeFloat32x4(1, 2, 3, 4)
      rec.seek(1)
      rec.resetDirty()
      expect(rec.isDirty).toBe(false)
    })
  })

  describe('reset', () => {
    it('resets count, cursor and dirty state without clearing data', () => {
      const rec = new BufferRecorder({ capacity: 2, autosize: false, recordByteSize: 16 })
      rec.writeFloat32x4(1, 2, 3, 4)
      rec.seek(1)
      rec.writeFloat32x4(5, 6, 7, 8)

      rec.reset()

      expect(rec.count).toBe(0)
      expect(rec.recordIndex).toBe(0)
      expect(rec.isDirty).toBe(false)
      expect(rec.dataFloat32[0]).toBe(1)
      expect(rec.dataFloat32[4]).toBe(5)
    })
  })

  describe('next / seek', () => {
    it('next advances recordIndex by 1 and updates count', () => {
      const rec = new BufferRecorder({ capacity: 3, autosize: false, recordByteSize: 4 })
      expect(rec.recordIndex).toBe(0)
      rec.next()
      expect(rec.recordIndex).toBe(1)
      expect(rec.count).toBe(2)
    })

    it('seek throws for a negative index', () => {
      const rec = new BufferRecorder({ capacity: 3, autosize: false, recordByteSize: 4 })
      expect(() => rec.seek(-1)).toThrow()
    })

    it('seek updates recordIndex and count to max(count, index + 1)', () => {
      const rec = new BufferRecorder({ capacity: 5, autosize: false, recordByteSize: 4 })
      rec.seek(3)
      expect(rec.recordIndex).toBe(3)
      expect(rec.count).toBe(4)
      rec.seek(1)
      expect(rec.recordIndex).toBe(1)
      expect(rec.count).toBe(4)
    })

    it('seek throws when exceeding capacity and autosize is false', () => {
      const rec = new BufferRecorder({ capacity: 2, autosize: false, recordByteSize: 4 })
      expect(() => rec.seek(5)).toThrow()
    })

    it('seek grows the buffer when exceeding capacity and autosize is true', () => {
      const rec = new BufferRecorder({ capacity: 2, autosize: true, recordByteSize: 4 })
      rec.seek(5)
      expect(rec.capacity).toBe(6)
      expect(rec.recordIndex).toBe(5)
    })
  })

  describe('setCount', () => {
    it('throws for a negative count', () => {
      const rec = new BufferRecorder({ capacity: 2, autosize: false, recordByteSize: 4 })
      expect(() => rec.setCount(-1)).toThrow()
    })

    it('sets count without moving the cursor', () => {
      const rec = new BufferRecorder({ capacity: 4, autosize: false, recordByteSize: 4 })
      rec.setCount(3)
      expect(rec.count).toBe(3)
      expect(rec.recordIndex).toBe(0)
    })

    it('grows the buffer if needed and autosize is true', () => {
      const rec = new BufferRecorder({ capacity: 2, autosize: true, recordByteSize: 4 })
      rec.setCount(10)
      expect(rec.count).toBe(10)
      expect(rec.capacity).toBe(10)
    })

    it('throws if count exceeds capacity and autosize is false', () => {
      const rec = new BufferRecorder({ capacity: 2, autosize: false, recordByteSize: 4 })
      expect(() => rec.setCount(10)).toThrow()
    })
  })

  describe('growToFit', () => {
    it('does nothing if requiredCount fits within capacity', () => {
      const rec = new BufferRecorder({ capacity: 4, autosize: false, recordByteSize: 4 })
      rec.growToFit(4)
      expect(rec.capacity).toBe(4)
    })

    it('throws when autosize is false and requiredCount exceeds capacity', () => {
      const rec = new BufferRecorder({ capacity: 2, autosize: false, recordByteSize: 4 })
      expect(() => rec.growToFit(3)).toThrow()
    })

    it('grows to at least double the capacity', () => {
      const rec = new BufferRecorder({ capacity: 2, autosize: true, recordByteSize: 4 })
      rec.growToFit(3)
      expect(rec.capacity).toBe(4)
    })

    it('grows to requiredCount when more than double the capacity is needed', () => {
      const rec = new BufferRecorder({ capacity: 2, autosize: true, recordByteSize: 4 })
      rec.growToFit(10)
      expect(rec.capacity).toBe(10)
    })

    it('preserves existing data after growing', () => {
      const rec = new BufferRecorder({ capacity: 2, autosize: true, recordByteSize: 4 })
      rec.writeFloat32(42)
      rec.growToFit(10)
      expect(rec.dataFloat32[0]).toBe(42)
    })

    it('replaces the buffer and typed array views with new instances', () => {
      const rec = new BufferRecorder({ capacity: 2, autosize: true, recordByteSize: 4 })
      const oldBuffer = rec.buffer
      rec.growToFit(10)
      expect(rec.buffer).not.toBe(oldBuffer)
      expect(rec.buffer.byteLength).toBe(40)
      expect(rec.dataFloat32.buffer).toBe(rec.buffer)
      expect(rec.dataInt32.buffer).toBe(rec.buffer)
      expect(rec.dataUint32.buffer).toBe(rec.buffer)
    })
  })

  describe('upload', () => {
    it('does nothing when not dirty and not forced', () => {
      const rec = new BufferRecorder({ capacity: 2, autosize: false, recordByteSize: 16 })
      const gpuBuffer = createGpuBuffer(rec.buffer.byteLength)
      rec.upload(gpuBuffer)
      expect(gpuBuffer.setData).not.toHaveBeenCalled()
      expect(gpuBuffer.setSubData).not.toHaveBeenCalled()
    })

    it('uploads the full buffer when forced even if not dirty', () => {
      const rec = new BufferRecorder({ capacity: 2, autosize: false, recordByteSize: 16 })
      const gpuBuffer = createGpuBuffer(rec.buffer.byteLength)
      rec.upload(gpuBuffer, true)
      expect(gpuBuffer.setData).toHaveBeenCalledWith(rec.buffer)
      expect(gpuBuffer.setSubData).not.toHaveBeenCalled()
    })

    it('uploads only the dirty sub range when the gpu buffer is large enough', () => {
      const rec = new BufferRecorder({ capacity: 4, autosize: false, recordByteSize: 16 })
      rec.seek(1)
      rec.writeFloat32x4(1, 2, 3, 4)
      rec.seek(2)
      const gpuBuffer = createGpuBuffer(rec.buffer.byteLength)
      rec.upload(gpuBuffer)
      expect(gpuBuffer.setSubData).toHaveBeenCalledWith(16, rec.buffer, 16, 16)
      expect(gpuBuffer.setData).not.toHaveBeenCalled()
    })

    it('uploads the full buffer when the gpu buffer is too small', () => {
      const rec = new BufferRecorder({ capacity: 4, autosize: false, recordByteSize: 16 })
      rec.writeFloat32x4(1, 2, 3, 4)
      const gpuBuffer = createGpuBuffer(rec.buffer.byteLength - 1)
      rec.upload(gpuBuffer)
      expect(gpuBuffer.setData).toHaveBeenCalledWith(rec.buffer)
      expect(gpuBuffer.setSubData).not.toHaveBeenCalled()
    })

    it('clears the dirty state after uploading', () => {
      const rec = new BufferRecorder({ capacity: 4, autosize: false, recordByteSize: 16 })
      rec.writeFloat32x4(1, 2, 3, 4)
      rec.seek(1)
      const gpuBuffer = createGpuBuffer(rec.buffer.byteLength)
      rec.upload(gpuBuffer)
      expect(rec.isDirty).toBe(false)
    })
  })

  describe('writeFloat32 / write2Float32 / write3Float32 / write4Float32', () => {
    it('writeFloat32 writes a single value and advances the cursor by 1', () => {
      const rec = new BufferRecorder({ capacity: 4, autosize: false, recordByteSize: 16 })
      rec.writeFloat32(1)
      rec.writeFloat32(2)
      expect(Array.from(rec.dataFloat32.slice(0, 2))).toEqual([1, 2])
    })

    it('write2Float32 writes 2 consecutive values', () => {
      const rec = new BufferRecorder({ capacity: 4, autosize: false, recordByteSize: 16 })
      rec.writeFloat32x2(1, 2)
      expect(Array.from(rec.dataFloat32.slice(0, 2))).toEqual([1, 2])
    })

    it('write3Float32 writes 3 consecutive values', () => {
      const rec = new BufferRecorder({ capacity: 4, autosize: false, recordByteSize: 16 })
      rec.writeFloat32x3(1, 2, 3)
      expect(Array.from(rec.dataFloat32.slice(0, 3))).toEqual([1, 2, 3])
    })

    it('write4Float32 writes 4 consecutive values', () => {
      const rec = new BufferRecorder({ capacity: 4, autosize: false, recordByteSize: 16 })
      rec.writeFloat32x4(1, 2, 3, 4)
      expect(Array.from(rec.dataFloat32.slice(0, 4))).toEqual([1, 2, 3, 4])
    })

    it('throws when writing beyond the end of the buffer', () => {
      const rec = new BufferRecorder({ capacity: 1, autosize: false, recordByteSize: 4 })
      rec.writeFloat32(1)
      expect(() => rec.writeFloat32(2)).toThrow()
    })
  })

  describe('writeInt32 / write2Int32 / write3Int32 / write4Int32', () => {
    it('writeInt32 writes a single value', () => {
      const rec = new BufferRecorder({ capacity: 4, autosize: false, recordByteSize: 16 })
      rec.writeInt32(-1, 0)
      expect(rec.dataInt32[0]).toBe(-1)
    })

    it('write2Int32 writes 2 consecutive values', () => {
      const rec = new BufferRecorder({ capacity: 4, autosize: false, recordByteSize: 16 })
      rec.writeInt32x2(-1, -2)
      expect(Array.from(rec.dataInt32.slice(0, 2))).toEqual([-1, -2])
    })

    it('write3Int32 writes 3 consecutive values', () => {
      const rec = new BufferRecorder({ capacity: 4, autosize: false, recordByteSize: 16 })
      rec.writeInt32x3(-1, -2, -3)
      expect(Array.from(rec.dataInt32.slice(0, 3))).toEqual([-1, -2, -3])
    })

    it('write4Int32 writes 4 consecutive values', () => {
      const rec = new BufferRecorder({ capacity: 4, autosize: false, recordByteSize: 16 })
      rec.writeInt32x4(-1, -2, -3, -4)
      expect(Array.from(rec.dataInt32.slice(0, 4))).toEqual([-1, -2, -3, -4])
    })
  })

  describe('writeUint32 / write2Uint32 / write3Uint32 / write4Uint32', () => {
    it('writeUint32 writes a value readable as an unsigned 32-bit integer', () => {
      const rec = new BufferRecorder({ capacity: 4, autosize: false, recordByteSize: 16 })
      rec.writeUint32(4000000000, 0)
      expect(rec.dataUint32[0]).toBe(4000000000)
    })

    it('write2Uint32 writes 2 consecutive values', () => {
      const rec = new BufferRecorder({ capacity: 4, autosize: false, recordByteSize: 16 })
      rec.writeUint32x2(1, 2)
      expect(Array.from(rec.dataUint32.slice(0, 2))).toEqual([1, 2])
    })

    it('write3Uint32 writes 3 consecutive values', () => {
      const rec = new BufferRecorder({ capacity: 4, autosize: false, recordByteSize: 16 })
      rec.writeUint32x3(1, 2, 3)
      expect(Array.from(rec.dataUint32.slice(0, 3))).toEqual([1, 2, 3])
    })

    it('write4Uint32 writes 4 consecutive values', () => {
      const rec = new BufferRecorder({ capacity: 4, autosize: false, recordByteSize: 16 })
      rec.writeUint32x4(1, 2, 3, 4)
      expect(Array.from(rec.dataUint32.slice(0, 4))).toEqual([1, 2, 3, 4])
    })
  })

  describe('writeVec2i / writeVec2u / writeVec2f', () => {
    it('writeVec2f writes x and y as floats', () => {
      const rec = new BufferRecorder({ capacity: 4, autosize: false, recordByteSize: 16 })
      rec.writeVec2f({ x: 1.5, y: 2.5 })
      expect(Array.from(rec.dataFloat32.slice(0, 2))).toEqual([1.5, 2.5])
    })

    it('writeVec2i writes x and y as ints', () => {
      const rec = new BufferRecorder({ capacity: 4, autosize: false, recordByteSize: 16 })
      rec.writeVec2i({ x: 1, y: 2 })
      expect(Array.from(rec.dataInt32.slice(0, 2))).toEqual([1, 2])
    })

    it('writeVec2u writes x and y as uints', () => {
      const rec = new BufferRecorder({ capacity: 4, autosize: false, recordByteSize: 16 })
      rec.writeVec2u({ x: 1, y: 2 })
      expect(Array.from(rec.dataUint32.slice(0, 2))).toEqual([1, 2])
    })
  })

  describe('writeVec3i / writeVec3u / writeVec3f', () => {
    it('writeVec3f writes x, y, z as floats', () => {
      const rec = new BufferRecorder({ capacity: 4, autosize: false, recordByteSize: 16 })
      rec.writeVec3f({ x: 1, y: 2, z: 3 })
      expect(Array.from(rec.dataFloat32.slice(0, 3))).toEqual([1, 2, 3])
    })

    it('defaults z to 0 when missing', () => {
      const rec = new BufferRecorder({ capacity: 4, autosize: false, recordByteSize: 16 })
      rec.writeVec3f({ x: 1, y: 2 })
      expect(Array.from(rec.dataFloat32.slice(0, 3))).toEqual([1, 2, 0])
    })
  })

  describe('writeVec4i / writeVec4u / writeVec4f', () => {
    it('writeVec4f writes x, y, z, w as floats', () => {
      const rec = new BufferRecorder({ capacity: 4, autosize: false, recordByteSize: 16 })
      rec.writeVec4f({ x: 1, y: 2, z: 3, w: 4 })
      expect(Array.from(rec.dataFloat32.slice(0, 4))).toEqual([1, 2, 3, 4])
    })

    it('defaults z and w to 0 when missing', () => {
      const rec = new BufferRecorder({ capacity: 4, autosize: false, recordByteSize: 16 })
      rec.writeVec4f({ x: 1, y: 2 })
      expect(Array.from(rec.dataFloat32.slice(0, 4))).toEqual([1, 2, 0, 0])
    })
  })

  describe('writeMat4', () => {
    it('writes all 16 matrix elements sequentially', () => {
      const rec = new BufferRecorder({ capacity: 4, autosize: false, recordByteSize: 64 })
      const elements = Array.from({ length: 16 }, (_, i) => i + 1)
      const mat4 = { elements } as unknown as Mat4
      rec.writeMat4(mat4)
      expect(Array.from(rec.dataFloat32.slice(0, 16))).toEqual(elements)
    })

    it('throws when there is not enough space left', () => {
      const rec = new BufferRecorder({ capacity: 1, autosize: false, recordByteSize: 32 })
      const mat4 = { elements: Array.from({ length: 16 }, (_, i) => i) } as unknown as Mat4
      expect(() => rec.writeMat4(mat4)).toThrow()
    })
  })

  describe('writeField', () => {
    it('writes a f32 field at its byte offset', () => {
      const rec = new BufferRecorder({ capacity: 4, autosize: false, recordByteSize: 16 })
      const field = { byteOffset: 4, type: 'f32' } as unknown as BufferField<'f32'>
      rec.writeField(field, 42)
      expect(rec.dataFloat32[1]).toBe(42)
    })

    it('writes a vec3f field at its byte offset', () => {
      const rec = new BufferRecorder({ capacity: 4, autosize: false, recordByteSize: 32 })
      const field = { byteOffset: 16, type: 'vec3f' } as unknown as BufferField<'vec3f'>
      rec.writeField(field, { x: 1, y: 2, z: 3 })
      expect(Array.from(rec.dataFloat32.slice(4, 7))).toEqual([1, 2, 3])
    })

    it('writes a mat4x4f field at its byte offset', () => {
      const rec = new BufferRecorder({ capacity: 1, autosize: false, recordByteSize: 64 })
      const field = { byteOffset: 0, type: 'mat4x4f' } as unknown as BufferField<'mat4x4f'>
      const elements = Array.from({ length: 16 }, (_, i) => i)
      rec.writeField(field, { elements } as unknown as Mat4)
      expect(Array.from(rec.dataFloat32.slice(0, 16))).toEqual(elements)
    })

    it('writes fields relative to the current record start', () => {
      const rec = new BufferRecorder({ capacity: 4, autosize: false, recordByteSize: 16 })
      rec.seek(1)
      const field = { byteOffset: 4, type: 'f32' } as unknown as BufferField<'f32'>
      rec.writeField(field, 99)
      expect(rec.dataFloat32[5]).toBe(99)
    })

    it('throws for unsupported field types', () => {
      const rec = new BufferRecorder({ capacity: 1, autosize: false, recordByteSize: 16 })
      const field = { byteOffset: 0, type: 'h32' } as unknown as BufferField<'f32'>
      expect(() => rec.writeField(field as any, 1 as any)).toThrow()
    })
  })

  describe('clearRecord', () => {
    it('zeroes out the data for the given record only', () => {
      const rec = new BufferRecorder({ capacity: 2, autosize: false, recordByteSize: 16 })
      rec.writeFloat32x4(1, 2, 3, 4)
      rec.seek(1)
      rec.writeFloat32x4(5, 6, 7, 8)

      rec.clearRecord(0)

      expect(Array.from(rec.dataFloat32.slice(0, 4))).toEqual([0, 0, 0, 0])
      expect(Array.from(rec.dataFloat32.slice(4, 8))).toEqual([5, 6, 7, 8])
    })

    it('marks the cleared record as dirty', () => {
      const rec = new BufferRecorder({ capacity: 2, autosize: false, recordByteSize: 16 })
      rec.clearRecord(1)
      expect(rec.isDirty).toBe(true)
    })
  })
})
