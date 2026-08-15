import { IVec2, IVec3, IVec4, Mat4 } from '@gglib/math'
import { GpuDataType } from '../enums'
import { Buffer, BufferField } from '../resources'

export interface BufferRecorderOptions {
  /**
   * Initial capacity of the buffer in number of instances. The buffer will automatically
   * grow if more instances are added beyond the initial capacity.
   */
  capacity: number

  /**
   * If true, the buffer will automatically resize when the instance count exceeds the current capacity.
   * If false, an error will be thrown when trying to exceed the capacity.
   */
  autosize: boolean

  /**
   * The stride size of each instance in bytes. This must be a multiple of 4 bytes to ensure proper alignment of the instance data.
   */
  recordByteSize: number

  /**
   * The target buffer to upload to during {@link BufferRecorder.commit}
   */
  gpuBuffer?: Buffer
}

export class BufferRecorder {
  /**
   * The number of active records in the buffer.
   */
  public readonly count: number

  /**
   * The maximum number of records that can be stored in the buffer without resizing.
   */
  public readonly capacity: number

  /**
   * Indicates whether the buffer will automatically resize when record `count` exceeds record `capacity`.
   */
  public readonly autosize: boolean

  /**
   * The size of a record in bytes
   */
  public readonly strideInBytes: number

  /**
   * The number of 4-byte-sized elements in one record
   */
  public readonly strideInElements: number

  /**
   * The current record index this writer points to.
   */
  public readonly recordIndex: number

  /**
   * The number of contiguous records that can be added to the buffer without exceeding the current capacity.
   */
  public get remainingRecordCount(): number {
    return this.capacity - this.recordIndex
  }

  public get isDirty(): boolean {
    this.updateDirty()
    return this.dirtyStart < this.dirtyEnd
  }

  /**
   * The GPU buffer where data can be uploaded to.
   *
   * If set, then this will be used as target during `commit`
   */
  public gpuBuffer: Buffer | null

  public readonly buffer: ArrayBuffer
  public readonly dataFloat32: Float32Array<ArrayBuffer>
  public readonly dataInt32: Int32Array<ArrayBuffer>
  public readonly dataUint32: Uint32Array<ArrayBuffer>

  /** index of element where write started */
  protected writeStart: number = 0
  /** index of element where write ended */
  protected writeEnd: number = 0
  /** index of element where dirty starts */
  protected dirtyStart: number = Infinity
  /** index of element where dirty ends */
  protected dirtyEnd: number = -Infinity

  public constructor(options: BufferRecorderOptions) {
    if (options.recordByteSize % 4 !== 0) {
      throw new Error(`Record byte size must be a multiple of 4 bytes (got ${this.strideInBytes})`)
    }

    if (options.recordByteSize <= 0) {
      throw new Error(`Record byte size must be greater than 0 (got ${this.strideInBytes})`)
    }

    if (options.capacity <= 0) {
      throw new Error(`Record capacity must be greater than 0 (got ${options.capacity})`)
    }

    this.count = 0
    this.recordIndex = 0
    this.capacity = options.capacity
    this.strideInBytes = options.recordByteSize
    this.strideInElements = this.strideInBytes / 4
    this.autosize = !!options.autosize
    this.gpuBuffer = options.gpuBuffer

    this.buffer = new ArrayBuffer(this.capacity * this.strideInBytes)
    this.dataFloat32 = new Float32Array(this.buffer)
    this.dataInt32 = new Int32Array(this.buffer)
    this.dataUint32 = new Uint32Array(this.buffer)
    this.writeStart = 0
    this.writeEnd = 0
  }

  private updateDirty(): this {
    if (this.writeStart === this.writeEnd) {
      // no element has been written
      return this
    }

    this.dirtyStart = Math.min(this.dirtyStart, this.writeStart)
    this.dirtyEnd = Math.max(this.dirtyEnd, this.writeEnd)
    return this
  }

  /**
   * Clears the dirty range without uploading.
   */
  public resetDirty(): this {
    this.dirtyStart = Infinity
    this.dirtyEnd = -Infinity
    return this
  }

  /**
   * Resets the write cursor and active record count to zero, and clears the dirty range.
   * Does not zero out existing data.
   */
  public reset(): this {
    this.seek(0)
    this.resetDirty()
    ;(this as Mutable<this>).count = 0
    return this
  }

  /**
   * Moves the write cursor to the next record slot.
   */
  public next(): this {
    return this.seek(this.recordIndex + 1)
  }

  /**
   * Moves the write cursor to the specified record index.
   * Grows the buffer if necessary (when `autosize` is true).
   * Updates `count` to `max(count, index + 1)`.
   */
  public seek(recordIndex: number): this {
    if (recordIndex < 0) {
      throw new Error(`record index cannot be negative (got ${recordIndex})`)
    }
    this.updateDirty()
    this.growToFit(recordIndex + 1)
    const self = this as Mutable<this>
    self.recordIndex = recordIndex
    self.count = Math.max(this.count, recordIndex + 1)
    this.writeStart = recordIndex * this.strideInElements
    this.writeEnd = this.writeStart
    return this
  }

  /**
   * Explicitly sets the active record count without moving the cursor.
   * Grows the buffer if necessary.
   */
  public setCount(count: number): this {
    if (count < 0) {
      throw new Error(`count cannot be negative (got ${count})`)
    }
    this.growToFit(count)
    ;(this as Mutable<this>).count = count
    return this
  }

  /**
   * Ensures the buffer can hold at least `requiredCount` records.
   * Grows the buffer if necessary (when `autosize` is true).
   */
  public growToFit(requiredCount: number): void {
    if (requiredCount <= this.capacity) {
      return
    }
    if (!this.autosize) {
      throw new Error(
        `BufferRecorder capacity exceeded (capacity: ${this.capacity}, required: ${requiredCount}). ` +
          `Set autosize: true to allow automatic growth.`,
      )
    }

    // At least double; always large enough to fit requiredCount.

    const newCapacity = Math.max(requiredCount, this.capacity * 2)

    const self = this as Mutable<this>
    const bytes = new Uint8Array(newCapacity * this.strideInBytes)
    bytes.set(new Uint8Array(this.buffer))
    self.buffer = bytes.buffer
    self.dataFloat32 = new Float32Array(this.buffer)
    self.dataInt32 = new Int32Array(this.buffer)
    self.dataUint32 = new Uint32Array(this.buffer)
    self.capacity = newCapacity
  }

  /**
   * calls {@link upload} with {@link gpuBuffer} as upload target
   */
  public commit(force?: boolean) {
    this.upload(this.gpuBuffer)
  }

  /**
   * Uploads dirty data to the GPU buffer.
   * - If the GPU buffer is too small or a full upload is forced, uploads the entire array.
   * - Otherwise uploads only the dirty byte range.
   *
   * @param force - Upload the full buffer even if nothing is dirty.
   */
  public upload(gpuBuffer: Buffer, force?: boolean) {
    if (!gpuBuffer) {
      throw new Error(`gpuBuffer must not be null`)
    }

    if (!this.isDirty && !force) {
      return
    }

    const needsFullUpload = force || !this.isDirty || gpuBuffer.size < this.buffer.byteLength

    if (needsFullUpload) {
      gpuBuffer.setData(this.buffer)
    } else {
      const offset = this.dirtyStart * 4
      const length = (this.dirtyEnd - this.dirtyStart) * 4
      gpuBuffer.setSubData(offset, this.buffer, offset, length)
    }
    this.resetDirty()
  }

  /**
   * Writes 1 float32 value at the current position and advances by 1 elements.
   */
  public writeFloat32Array(data: ArrayLike<number>): this {
    this.assertCursorSpace(data.length)
    for (let i = 0; i < data.length; i++) {
      this.dataFloat32[this.writeEnd++] = data[i]
    }
    return this
  }

  /**
   * Writes 1 float32 value at the current position and advances by 1 elements.
   */
  public writeFloat32(c1: number): this {
    this.assertCursorSpace(1)
    this.dataFloat32[this.writeEnd++] = c1
    return this
  }

  /**
   * Writes 2 float32 values at the current position and advances by 2 elements.
   */
  public writeFloat32x2(c1: number, c2: number): this {
    this.assertCursorSpace(2)
    this.dataFloat32[this.writeEnd++] = c1
    this.dataFloat32[this.writeEnd++] = c2
    return this
  }

  /**
   * Writes 3 float32 values at the current position and advances by 3 elements.
   */
  public writeFloat32x3(c1: number, c2: number, c3: number): this {
    this.assertCursorSpace(3)
    this.dataFloat32[this.writeEnd++] = c1
    this.dataFloat32[this.writeEnd++] = c2
    this.dataFloat32[this.writeEnd++] = c3
    return this
  }

  /**
   * Writes 4 float32 values at the current position and advances by 4 elements.
   */
  public writeFloat32x4(c1: number, c2: number, c3: number, c4: number): this {
    this.assertCursorSpace(4)
    this.dataFloat32[this.writeEnd++] = c1
    this.dataFloat32[this.writeEnd++] = c2
    this.dataFloat32[this.writeEnd++] = c3
    this.dataFloat32[this.writeEnd++] = c4
    return this
  }

  /**
   * Writes 1 int32 value at the current position and advances by 1 elements.
   */
  public writeInt32(c1: number, c2: number): this {
    this.assertCursorSpace(1)
    this.dataInt32[this.writeEnd++] = c1
    return this
  }

  /**
   * Writes 2 int32 values at the current position and advances by 2 elements.
   */
  public writeInt32x2(c1: number, c2: number): this {
    this.assertCursorSpace(2)
    this.dataInt32[this.writeEnd++] = c1
    this.dataInt32[this.writeEnd++] = c2
    return this
  }

  /**
   * Writes 3 int32 values at the current position and advances by 3 elements.
   */
  public writeInt32x3(c1: number, c2: number, c3: number): this {
    this.assertCursorSpace(3)
    this.dataInt32[this.writeEnd++] = c1
    this.dataInt32[this.writeEnd++] = c2
    this.dataInt32[this.writeEnd++] = c3
    return this
  }

  /**
   * Writes 4 int32 values at the current position and advances by 4 elements.
   */
  public writeInt32x4(c1: number, c2: number, c3: number, c4: number): this {
    this.assertCursorSpace(4)
    this.dataInt32[this.writeEnd++] = c1
    this.dataInt32[this.writeEnd++] = c2
    this.dataInt32[this.writeEnd++] = c3
    this.dataInt32[this.writeEnd++] = c4
    return this
  }

  /**
   * Writes 1 uint32 value at the current position and advances by 1 elements.
   */
  public writeUint32(c1: number, c2: number): this {
    this.assertCursorSpace(1)
    this.dataInt32[this.writeEnd++] = c1
    return this
  }

  /**
   * Writes 2 uint32 values at the current position and advances by 2 elements.
   */
  public writeUint32x2(c1: number, c2: number): this {
    this.assertCursorSpace(2)
    this.dataUint32[this.writeEnd++] = c1
    this.dataUint32[this.writeEnd++] = c2
    return this
  }

  /**
   * Writes 3 uint32 values at the current position and advances by 3 elements.
   */
  public writeUint32x3(c1: number, c2: number, c3: number): this {
    this.assertCursorSpace(3)
    this.dataUint32[this.writeEnd++] = c1
    this.dataUint32[this.writeEnd++] = c2
    this.dataUint32[this.writeEnd++] = c3
    return this
  }

  /**
   * Writes 4 uint32 values at the current position and advances by 4 elements.
   */
  public writeUint32x4(c1: number, c2: number, c3: number, c4: number): this {
    this.assertCursorSpace(4)
    this.dataUint32[this.writeEnd++] = c1
    this.dataUint32[this.writeEnd++] = c2
    this.dataUint32[this.writeEnd++] = c3
    this.dataUint32[this.writeEnd++] = c4
    return this
  }

  /**
   * Writes a vec2
   */
  public writeVec2i(value: IVec2 | IVec3 | IVec4): this {
    return this.writeInt32x2(value.x, value.y)
  }

  /**
   * Writes a vec2
   */
  public writeVec2u(value: IVec2 | IVec3 | IVec4): this {
    return this.writeUint32x2(value.x, value.y)
  }

  /**
   * Writes a vec2
   */
  public writeVec2f(value: IVec2 | IVec3 | IVec4): this {
    return this.writeFloat32x2(value.x, value.y)
  }

  /**
   * Writes a vec3, missing z filled with 0
   */
  public writeVec3i(value: IVec2 | IVec3 | IVec4): this {
    return this.writeInt32x3(value.x, value.y, (value as IVec3).z ?? 0)
  }

  /**
   * Writes a vec3, missing z filled with 0
   */
  public writeVec3u(value: IVec2 | IVec3 | IVec4): this {
    return this.writeUint32x3(value.x, value.y, (value as IVec3).z ?? 0)
  }

  /**
   * Writes a vec3, missing z filled with 0
   */
  public writeVec3f(value: IVec2 | IVec3 | IVec4): this {
    return this.writeFloat32x3(value.x, value.y, (value as IVec3).z ?? 0)
  }

  /**
   * Writes a vec4, missing z and w filled with 0
   */
  public writeVec4i(value: IVec2 | IVec3 | IVec4): this {
    return this.writeInt32x4(value.x, value.y, (value as IVec3).z ?? 0, (value as IVec4).w ?? 0)
  }

  /**
   * Writes a vec4, missing z and w filled with 0
   */
  public writeVec4u(value: IVec2 | IVec3 | IVec4): this {
    return this.writeUint32x4(value.x, value.y, (value as IVec3).z ?? 0, (value as IVec4).w ?? 0)
  }

  /**
   * Writes a vec4, missing z and w filled with 0
   */
  public writeVec4f(value: IVec2 | IVec3 | IVec4): this {
    return this.writeFloat32x4(value.x, value.y, (value as IVec3).z ?? 0, (value as IVec4).w ?? 0)
  }

  /**
   * Writes a Mat4 (16 floats) at the current cursor.
   */
  public writeMat4(value: Mat4): this {
    this.assertCursorSpace(value.elements.length)
    for (let i = 0; i < value.elements.length; i++) {
      this.dataFloat32[this.writeEnd++] = value.elements[i]
    }
    return this
  }

  /**
   * Moves the cursor to the given field's byte offset within the current record
   * and writes the value according to the field's type.
   */
  public writeField(field: BufferField<'mat4x4f'>, value: Mat4): this
  public writeField(
    field: BufferField<'vec2u' | 'vec3u' | 'vec4u' | 'vec2f' | 'vec3f' | 'vec4f' | 'vec2i' | 'vec3i' | 'vec4i'>,
    value: IVec4 | IVec3 | IVec2,
  ): this
  public writeField(field: BufferField<'f32' | 'i32' | 'u32'>, value: number): this
  public writeField<T extends GpuDataType>(field: BufferField<T>, value: any): this {
    this.updateDirty()
    this.writeEnd = this.writeStart + (field.byteOffset >> 2) // division by 4
    const writer = FIELD_WRITER[field.type]
    if (!writer) {
      throw new Error(`BufferRecorder.writeField: unsupported field type '${field.type}'`)
    }
    writer.call(this, value)
    return this
  }

  /**
   * Zeroes out all data for the given record index and marks it dirty.
   */
  public clearRecord(index: number): this {
    this.updateDirty()
    const start = index * this.strideInElements
    const end = start + this.strideInElements
    this.dataFloat32.fill(0, start, end)
    this.dirtyStart = Math.min(this.writeStart, start)
    this.dirtyEnd = Math.max(this.writeEnd, end)
    return this
  }

  private assertCursorSpace(count: number): void {
    if (this.writeEnd + count > this.dataFloat32.length) {
      throw new Error(
        `BufferRecorder: write of ${count} element(s) at cursor ${this.writeEnd} would exceed buffer ` +
          `(length: ${this.dataFloat32.length}). Did you forget to call seek() or next()?`,
      )
    }
  }
}

type Mutable<T> = {
  -readonly [K in keyof T]: T[K]
}

const FIELD_WRITER: Record<GpuDataType, Function> = {
  f32: BufferRecorder.prototype.writeFloat32,
  i32: BufferRecorder.prototype.writeInt32,
  u32: BufferRecorder.prototype.writeUint32,
  h32: null,
  vec2f: BufferRecorder.prototype.writeVec2f,
  vec2i: BufferRecorder.prototype.writeVec2i,
  vec2u: BufferRecorder.prototype.writeVec2u,
  vec2h: null,
  vec3f: BufferRecorder.prototype.writeVec3f,
  vec3i: BufferRecorder.prototype.writeVec3i,
  vec3u: BufferRecorder.prototype.writeVec3u,
  vec3h: null,
  vec4f: BufferRecorder.prototype.writeVec4f,
  vec4i: BufferRecorder.prototype.writeVec4i,
  vec4u: BufferRecorder.prototype.writeVec4u,
  vec4h: null,
  mat2x2f: null,
  mat2x3f: null,
  mat2x4f: null,
  mat3x2f: null,
  mat3x3f: null,
  mat3x4f: null,
  mat4x2f: null,
  mat4x3f: null,
  mat4x4f: BufferRecorder.prototype.writeMat4,
  mat2x2h: null,
  mat2x3h: null,
  mat2x4h: null,
  mat3x2h: null,
  mat3x3h: null,
  mat3x4h: null,
  mat4x2h: null,
  mat4x3h: null,
  mat4x4h: null,
}
