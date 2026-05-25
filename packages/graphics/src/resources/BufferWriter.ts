import { IVec2, IVec3, IVec4, Mat4 } from '@gglib/math'
import { Buffer, BufferField, BufferFieldType } from '../resources'

export interface BufferWriterOptions {
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
   * The GPU buffer that will be used to store the instance data.
   */
  buffer: Buffer
}

export class BufferWriter {
  /**
   * The number of active records in the buffer.
   */
  public readonly count: number

  /**
   * The maximum number of records that can be stored in the buffer without resizing.
   */
  public readonly capacity: number

  /**
   * Indicates whether the buffer will automatically resize when the instance count exceeds the current capacity.
   */
  public readonly autosize: boolean

  /**
   * The record size of a record in bytes.
   */
  public readonly recordByteSize: number

  /**
   * The current record index this writer points to.
   */
  public readonly recordIndex: number

  /**
   * The GPU buffer that will be used to store the instance data.
   */
  public readonly buffer: Buffer

  public get isDirty(): boolean {
    return this.dirtyMin < this.dirtyMax
  }

  protected data: Float32Array<ArrayBuffer>
  protected dataCursor: number = 0
  protected dirtyMin: number = Infinity
  protected dirtyMax: number = -Infinity

  /**
   * The number of contiguous records that can be added to the buffer without exceeding the current capacity.
   */
  public get remainingRecordCount(): number {
    return this.capacity - this.recordIndex
  }

  public constructor(options: BufferWriterOptions) {
    if (options.recordByteSize % 4 !== 0) {
      throw new Error(`Instance stride must be a multiple of 4 bytes (got ${this.recordByteSize})`)
    }

    if (options.recordByteSize <= 0) {
      throw new Error(`Instance stride must be greater than 0 (got ${this.recordByteSize})`)
    }

    if (options.capacity <= 0) {
      throw new Error(`Instance capacity must be greater than 0 (got ${options.capacity})`)
    }

    if (!options.buffer) {
      throw new Error('Instance buffer is required')
    }

    this.count = 0
    this.recordIndex = 0
    this.capacity = options.capacity
    this.recordByteSize = options.recordByteSize
    this.autosize = !!options.autosize

    this.buffer = options.buffer
    this.data = new Float32Array((this.capacity * this.recordByteSize) / Float32Array.BYTES_PER_ELEMENT)
    this.dataCursor = 0
  }

  /**
   * Resets the write cursor and active record count to zero, and clears the dirty range.
   * Does not zero out existing data.
   */
  public reset(): this {
    ;(this as Mutable<this>).count = 0
    this.seek(0)
    this.resetDirty()
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
  public seek(index: number): this {
    if (index < 0) {
      throw new Error(`record index cannot be negative (got ${index})`)
    }
    this.growToFit(index + 1)
    const self = this as Mutable<this>
    self.recordIndex = index
    self.count = Math.max(this.count, index + 1)
    this.dataCursor = (index * this.recordByteSize) / Float32Array.BYTES_PER_ELEMENT
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
        `BufferWriter capacity exceeded (capacity: ${this.capacity}, required: ${requiredCount}). ` +
          `Set autosize: true to allow automatic growth.`,
      )
    }

    // At least double; always large enough to fit requiredCount.
    const newCapacity = Math.max(requiredCount, this.capacity * 2)
    const resized = new Float32Array((newCapacity * this.recordByteSize) / Float32Array.BYTES_PER_ELEMENT)
    resized.set(this.data)
    this.data = resized
    ;(this as Mutable<this>).capacity = newCapacity
  }

  /**
   * Marks the given record index as modified.
   */
  public markDirty(index: number): this {
    this.dirtyMin = Math.min(this.dirtyMin, index)
    this.dirtyMax = Math.max(this.dirtyMax, index + 1)
    return this
  }

  /**
   * Clears the dirty range without uploading.
   */
  public resetDirty(): this {
    this.dirtyMin = Infinity
    this.dirtyMax = -Infinity
    return this
  }

  /**
   * Uploads dirty data to the GPU buffer.
   * - If the GPU buffer is too small or a full upload is forced, uploads the entire array.
   * - Otherwise uploads only the dirty byte range.
   *
   * @param force - Upload the full buffer even if nothing is dirty.
   */
  public commit(force?: boolean) {
    if (!this.isDirty && !force) {
      return
    }

    const needsFullUpload = force || !this.isDirty || this.buffer.size < this.data.byteLength

    if (needsFullUpload) {
      this.buffer.setData(this.data.buffer)
    } else {
      const offset = this.dirtyMin * this.recordByteSize
      const length = (this.dirtyMax - this.dirtyMin) * this.recordByteSize
      this.buffer.setSubData(offset, this.data.buffer, offset, length)
    }
    this.resetDirty()
  }

  /**
   * Writes 4 float components at the current cursor and advances by 4 elements.
   */
  public writeRow(c1: number, c2: number, c3: number, c4: number): this {
    this.assertCursorSpace(4)
    this.markDirty(this.recordIndex)
    this.data[this.dataCursor++] = c1
    this.data[this.dataCursor++] = c2
    this.data[this.dataCursor++] = c3
    this.data[this.dataCursor++] = c4
    return this
  }

  /**
   * Writes a vec2/vec3/vec4 as 4 floats (missing z/w filled with 0).
   */
  public writeVec(value: IVec2 | IVec3 | IVec4): this {
    return this.writeRow(value.x, value.y, (value as IVec3).z ?? 0, (value as IVec4).w ?? 0)
  }

  /**
   * Writes a Mat4 (16 floats) at the current cursor.
   */
  public writeMat4(value: Mat4): this {
    this.assertCursorSpace(value.elements.length)
    this.markDirty(this.recordIndex)
    for (let i = 0; i < value.elements.length; i++) {
      this.data[this.dataCursor++] = value.elements[i]
    }
    return this
  }

  private warned = false
  /**
   * Writes a raw Float32Array block at the current cursor.
   * Clamps to available space and warns on overflow (once per array instance).
   */
  public writeData(value: Float32Array<ArrayBuffer>) {
    this.markDirty(this.recordIndex)
    const count = Math.min(value.length, this.data.length - this.dataCursor)
    if (count != value.length && !this.warned) {
      this.warned = true
      console.warn(`Instance data overflow: writing ${value.length} elements but only ${count} are available`)
    }

    for (let i = 0; i < count; i++) {
      this.data[this.dataCursor++] = value[i]
    }
  }

  /**
   * Moves the cursor to the given field's byte offset within the current record
   * and writes the value according to the field's type.
   *
   * Supported field types: `'mat4'`, `'vec4'`.
   */
  public writeField(field: BufferField<'mat4'>, value: Mat4): this
  public writeField(field: BufferField<'vec4'>, value: IVec4 | IVec3 | IVec2): this
  public writeField<T extends BufferFieldType>(field: BufferField<T>, value: any): this {
    this.dataCursor = (this.recordIndex * this.recordByteSize + field.byteOffset) / Float32Array.BYTES_PER_ELEMENT

    if (field.type === 'mat4') {
      return this.writeMat4(value)
    } else if (field.type === 'vec4') {
      return this.writeVec(value)
    } else {
      throw new Error(`BufferWriter.writeField: unsupported field type '${field.type}'`)
    }
  }

  /**
   * Zeroes out all float data for the given record index and marks it dirty.
   */
  public clearRecord(index: number): this {
    this.markDirty(index)
    const elementCount = this.recordByteSize / Float32Array.BYTES_PER_ELEMENT
    const offset = index * elementCount
    this.data.fill(0, offset, offset + elementCount)
    return this
  }

  private assertCursorSpace(count: number): void {
    if (this.dataCursor + count > this.data.length) {
      throw new Error(
        `BufferWriter: write of ${count} element(s) at cursor ${this.dataCursor} would exceed buffer ` +
          `(length: ${this.data.length}). Did you forget to call seek() or next()?`,
      )
    }
  }
}

type Mutable<T> = {
  -readonly [K in keyof T]: T[K]
}
