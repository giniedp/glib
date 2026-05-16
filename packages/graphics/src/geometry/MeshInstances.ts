import { IVec2, IVec3, IVec4, Mat4 } from '@gglib/math'
import { BufferField, BufferLayout } from '../BufferLayout'
import { Buffer } from '../resources'

export interface MeshInstancesOptions<T extends BufferLayout = BufferLayout> {
  layout: T
  capacity: number
  buffer: Buffer
}

export class MeshInstances<T extends BufferLayout = BufferLayout> {
  public readonly layout: T
  public readonly count: number = 0
  public readonly capacity: number
  public readonly data: Float32Array<ArrayBuffer>
  protected dirtyMin: number = Infinity
  protected dirtyMax: number = -Infinity
  public buffer: Buffer

  public get isDirty(): boolean {
    return this.dirtyMin < this.dirtyMax
  }

  public constructor(options: MeshInstancesOptions<T>) {
    this.layout = options.layout
    this.capacity = options.capacity
    this.data = new Float32Array((this.capacity * this.layout.stride) / Float32Array.BYTES_PER_ELEMENT)
    this.buffer = options.buffer
  }

  /**
   * Sets the number of active instances. If the count exceeds the current capacity,
   * the instance data buffer will be resized to accomodate the new count.
   */
  public setCount(count: number): void {
    if (count > this.capacity) {
      this.ensureCapacity(count)
    }
    const self = this as Mutable<this>
    self.count = count
  }

  public ensureCapacity(count: number): void {
    if (count <= this.capacity) {
      return
    }
    const newCapacity = Math.max(count, this.capacity * 2)
    const newBuffer = new Float32Array((newCapacity * this.layout.stride) / Float32Array.BYTES_PER_ELEMENT)
    if (this.data) {
      newBuffer.set(this.data)
    }
    const self = this as Mutable<this>
    self.data = newBuffer
    self.capacity = newCapacity
  }

  public writeFieldVec4(instance: number, name: keyof T['fields'], value: IVec4 | IVec3 | IVec2): void {
    const field = this.layout.fields[name as any]
    this.writeVec4(instance, field, value)
  }

  public writeFieldMat4(instance: number, name: keyof T['fields'], value: Mat4): void {
    const field = this.layout.fields[name as any]
    this.writeMat4(instance, field, value)
  }

  public writeVec4(instance: number, field: BufferField<'vec4'>, value: IVec4 | IVec3 | IVec2): void {
    if (instance >= this.count) {
      throw new Error(`Instance index ${instance} is out of bounds (count: ${this.count})`)
    }
    const offset = (instance * this.layout.stride + field.byteOffset) / Float32Array.BYTES_PER_ELEMENT
    this.data[offset] = value.x
    this.data[offset + 1] = value.y
    this.data[offset + 2] = (value as IVec4).z ?? 0
    this.data[offset + 3] = (value as IVec4).w ?? 0

    const byteOffset = offset * Float32Array.BYTES_PER_ELEMENT
    this.dirtyMin = Math.min(this.dirtyMin, byteOffset)
    this.dirtyMax = Math.max(this.dirtyMax, byteOffset + 16) // vec4 = 16 bytes
  }

  public writeMat4(instance: number, field: BufferField<'mat4'>, value: Mat4): void {
    if (instance >= this.count) {
      throw new Error(`Instance index ${instance} is out of bounds (count: ${this.count})`)
    }
    const offset = (instance * this.layout.stride + field.byteOffset) / Float32Array.BYTES_PER_ELEMENT
    const elements = value.elements
    for (let i = 0; i < 16; i++) {
      this.data[offset + i] = elements[i]
    }
    const byteOffset = offset * Float32Array.BYTES_PER_ELEMENT
    this.dirtyMin = Math.min(this.dirtyMin, byteOffset)
    this.dirtyMax = Math.max(this.dirtyMax, byteOffset + 64) // mat4 = 64 bytes
  }

  public resetDirty(): void {
    this.dirtyMin = Infinity
    this.dirtyMax = -Infinity
  }

  public commit(force?: boolean) {
    if (this.isDirty || force) {
      if (this.buffer.size < this.data.byteLength) {
        this.buffer.setData(this.data)
      } else {
        this.buffer.setSubData(0, this.data.buffer, 0, this.data.byteLength)
      }
      this.resetDirty()
    }
  }
}

type Mutable<T> = {
  -readonly [K in keyof T]: T[K]
}
