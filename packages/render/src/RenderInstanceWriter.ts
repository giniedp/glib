import { BufferRecorder, BufferUsage, Device, Program, WebglDevice } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'

// TODO: use options, allow to to have transforms+data in one buffer
// export interface RenderInstanceWriterOptions {
//   /**
//    * Initial capacity
//    */
//   capacity: number

//   /**
//    * Instance data size in bytes, excluding transform data
//    */
//   sizeInBytes: number
// }

export class RenderInstanceWriter {
  protected transforms: BufferRecorder
  protected instances: BufferRecorder

  /**
   * Current record index
   */
  public get index() {
    return this.transforms?.recordIndex ?? 0
  }

  /**
   * Total instance count written
   */
  public get count() {
    return this.transforms?.count ?? 0
  }

  public device: Device
  public constructor(device: Device) {
    this.device = device
  }

  protected createBuffers() {
    if (this.device.isWebGPU) {
      this.createBuffersWebGpu()
    } else {
      this.createBuffersWebGL()
    }
  }

  protected createBuffersWebGpu() {
    const device = this.device
    const capacity = 512 // arbitrary initial capacity, will be automatically resized if needed
    const strideInBytes = 16 * Float32Array.BYTES_PER_ELEMENT // Mat4 or 4 vec4s for unknown data
    this.transforms = new BufferRecorder({
      capacity,
      autosize: true,
      recordByteSize: strideInBytes,
      gpuBuffer: device.createBuffer({
        size: capacity * strideInBytes,
        usage: BufferUsage.STORAGE,
      }),
    })
    this.instances = new BufferRecorder({
      capacity,
      autosize: true,
      recordByteSize: strideInBytes, // unknown data, using 4 vec4s just in case
      gpuBuffer: device.createBuffer({
        size: capacity * strideInBytes,
        usage: BufferUsage.STORAGE,
      }),
    })
  }

  protected createBuffersWebGL() {
    const device = this.device as WebglDevice
    const strideInBytes = 16 * Float32Array.BYTES_PER_ELEMENT // Mat4
    const instanceCount = device.capabilities.maxUniformBlockSize / strideInBytes
    this.transforms = new BufferRecorder({
      autosize: false,
      capacity: instanceCount,
      recordByteSize: strideInBytes,
      gpuBuffer: device.createBuffer({
        size: instanceCount * strideInBytes,
        usage: BufferUsage.UNIFORM,
      }),
    })
    this.instances = new BufferRecorder({
      autosize: false,
      capacity: instanceCount,
      recordByteSize: strideInBytes,
      gpuBuffer: device.createBuffer({
        size: instanceCount * strideInBytes,
        usage: BufferUsage.UNIFORM,
      }),
    })
  }

  /**
   * Prepares buffers for next batch. Does not reset the write index.
   */
  public begin() {
    if (!this.transforms) {
      this.createBuffers()
    }
  }

  /**
   * Sets the instances buffers to the given program
   */
  public apply(program: Program) {
    program.mustGet(program.perInstanceTransformBlock).setBuffer(this.transforms.gpuBuffer)
    if (program.perInstanceDataBlock) {
      program.mustGet(program.perInstanceDataBlock).setBuffer(this.instances.gpuBuffer)
    }
  }

  public write(index: number, transform: Mat4, data?: Float32Array<ArrayBuffer> | null) {
    this.transforms.seek(index)
    this.transforms.writeMat4(transform)

    if (data) {
      this.instances.seek(index)
      this.instances.writeFloat32Array(data)
    } else {
      this.instances.seek(index)
      this.instances.clearRecord(index)
    }
  }

  public commit() {
    console.assert(!!this.transforms, 'buffers not created')
    this.transforms.commit()
    this.instances.commit()
  }

  public reset() {
    if (!this.transforms) {
      this.createBuffers()
    }
    this.transforms.reset()
    this.instances.reset()
  }
}
