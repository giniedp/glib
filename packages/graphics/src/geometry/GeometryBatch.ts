import { IVec4, Mat4, Vec4 } from '@gglib/math'
import { PooledList } from '@gglib/utils'
import { Device } from '../Device'
import { RenderEncoder } from '../RenderEncoder'
import { Program, RingBuffer, VertexBuffer, VertexBufferOptions } from '../resources'
import { Renderable } from '../types'
import { Geometry } from './Geometry'

/**
 * Constructor options for {@link MeshBatch}
 *
 * @public
 */
export interface GeometryBatchOptions {
  /**
   * The maximum number of instances this batch should handle in one draw call
   */
  batchSize?: number

  geometry: Geometry
}

/**
 * @public
 */
export class GeometryBatch implements Renderable {
  public readonly device: Device

  private batch: GeometryInstanceBuffer
  private vertexBuffer: VertexBuffer

  private get indexBuffer() {
    return this.geometry?.indexBuffer
  }

  private geometry: Geometry | null = null
  private queue: GeometryInstance[] = []
  private pool = new PooledList<GeometryInstance>(() => {
    return {
      program: null,
      transform: new Mat4(),
      row1: { x: 0, y: 0, z: 0, w: 0 },
      row2: { x: 0, y: 0, z: 0, w: 0 },
    }
  })

  public constructor(device: Device, options: GeometryBatchOptions) {
    this.device = device
    this.geometry = options.geometry
    this.batch = new GeometryInstanceBuffer({
      capacity: options.batchSize || 512,
    })

    this.vertexBuffer = device.createVertexBuffer([this.batch.bufferOptions()])
    for (const buffer of this.geometry.vertexBuffer.buffers) {
      this.vertexBuffer.buffers.push(buffer)
    }
  }

  /**
   * Clears the batch and starts a new instance with given geometry
   */
  public begin() {
    this.pool.clear()
  }

  public size() {
    return this.pool.size
  }

  /**
   * Starts a new instance with given transform
   */
  public next(transform: Mat4, program: Program): GeometryInstance {
    const instance = this.pool.next()
    instance.program = program
    instance.transform.initFrom(transform)
    Vec4.initZero(instance.row1)
    Vec4.initZero(instance.row2)

    return instance
  }

  public draw() {
    this.render(this.device.renderPass)
  }

  public render(pass: RenderEncoder) {
    this.queue.length = 0
    this.pool.toArray(this.queue)
    const queue = this.queue

    let start = 0
    let count = 0
    let program = queue[0]?.program
    for (let i = 0; i < queue.length; i++) {
      if (program !== queue[i].program) {
        this.drawSlice(pass, queue, start, count, program)
        program = queue[i].program
        start = i
        count = 0
      }
      count++
    }
    if (count > 0 && program) {
      this.drawSlice(pass, queue, start, count, program)
    }
  }

  private drawSlice(
    pass: RenderEncoder,
    sprites: GeometryInstance[],
    spriteOffset: number,
    spriteCount: number,
    program: Program,
  ) {
    if (spriteCount <= 0) {
      return
    }

    const spriteEnd = spriteOffset + spriteCount
    const batch = this.batch
    pass.setProgram(program)
    while (spriteOffset < spriteEnd) {
      if (batch.instanceOffset >= batch.capacity) {
        batch.reset()
      }

      const instanceCount = batch.remainingContiguous(spriteEnd - spriteOffset)
      const byteOffset = batch.byteOffset
      const byteSize = instanceCount * batch.strideInBytes

      for (let i = 0; i < instanceCount; i++) {
        batch.push(sprites[spriteOffset++])
      }

      this.vertexBuffer.buffers[0].setSubData(0, batch.data.buffer, byteOffset, byteSize)
      pass.setIndexBuffer(this.indexBuffer)
      pass.setVertexBuffer(this.vertexBuffer)
      pass.setPrimitiveType(this.geometry.primitiveType)
      if (this.indexBuffer) {
        pass.drawIndexed(this.geometry.indexCount, instanceCount, this.geometry.indexOffset, 0)
      } else {
        pass.draw(this.geometry.vertexCount, instanceCount, 0, 0)
      }
      pass.submit()
    }
  }

  public dispose() {
    //
  }
}

export type GeometryInstance = {
  program: Program
  transform: Mat4
  row1: IVec4
  row2: IVec4
}

export class GeometryInstanceBuffer extends RingBuffer<GeometryInstance, Float32Array<ArrayBuffer>> {
  public readonly data: Float32Array<ArrayBuffer>
  public readonly capacity: number
  public readonly strideInBytes: number = 96
  public readonly strideElements: number = this.strideInBytes / Float32Array.BYTES_PER_ELEMENT

  public constructor({ capacity }: { capacity: number }) {
    super()
    if (capacity <= 0) {
      throw new Error('capacity must be greater than 0')
    }

    this.capacity = capacity
    this.data = new Float32Array(this.capacity * this.strideElements)
  }

  protected write(value: GeometryInstance): void {
    let offset = this.instanceOffset * this.strideElements

    value.transform.toArray(this.data, offset)
    offset += 16

    this.data[offset++] = value.row1.x
    this.data[offset++] = value.row1.y
    this.data[offset++] = value.row1.z
    this.data[offset++] = value.row1.w

    this.data[offset++] = value.row2.x
    this.data[offset++] = value.row2.y
    this.data[offset++] = value.row2.z
    this.data[offset++] = value.row2.w
  }

  public bufferOptions(): VertexBufferOptions[0] {
    return {
      name: 'Instance Data Data',
      vertexLayout: {
        aTransform0: {
          elementType: 'float32',
          elementCount: 4,
          byteOffset: 0,
        },
        aTransform1: {
          elementType: 'float32',
          elementCount: 4,
          byteOffset: 16,
        },
        aTransform2: {
          elementType: 'float32',
          elementCount: 4,
          byteOffset: 32,
        },
        aTransform3: {
          elementType: 'float32',
          elementCount: 4,
          byteOffset: 48,
        },
        aRow1: {
          elementType: 'float32',
          elementCount: 4,
          byteOffset: 64,
        },
        aRow2: {
          elementType: 'float32',
          elementCount: 4,
          byteOffset: 80,
        },
      },
      instanced: true,
      stride: this.strideInBytes,
      size: this.sizeInBytes,
    }
  }
}
