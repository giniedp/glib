import { GpuTimer, type GpuTimerOptions } from '../GpuTimer'

/**
 * Maximum number of timers per device, each timer owns two timestamp slots
 */
const MAX_TIMERS = 64

/**
 * Number of frames that may wait for their readback at the same time
 */
const RING_SIZE = 3

const RESOLVE_ENCODER: GPUCommandEncoderDescriptor = { label: 'gglib timers' }

/**
 * Owns the timestamp query set and the readback of all {@link GpuTimer}s of a WebGPU device
 *
 * @remarks
 * Each timer owns the fixed slots `2 * index` (begin) and `2 * index + 1` (end).
 * Encoders call {@link getWrites} right before they begin a pass. {@link resolve} copies the
 * timestamps into a readback buffer once per frame and maps it without waiting.
 * When all readback buffers are busy, the frame is dropped.
 */
export class WebGpuTimers {
  /**
   * Whether the device supports timestamp queries
   */
  public enabled = false

  /**
   * Number of frames whose timestamps were dropped, because all readback buffers were busy
   */
  public drops = 0

  private readonly timers: GpuTimer[] = []
  private gpu: GPUDevice = null
  private querySet: GPUQuerySet = null
  private resolveBuffer: GPUBuffer = null
  private readonly readback: GPUBuffer[] = []

  /**
   * Timers that wrote their begin timestamp in the current frame
   */
  private readonly written = new Uint8Array(MAX_TIMERS)

  /**
   * Snapshot of {@link written} per readback buffer
   */
  private readonly pending: Uint8Array[] = []
  private readonly pendingCount = new Int32Array(RING_SIZE)
  private readonly pendingFrame = new Int32Array(RING_SIZE)
  private readonly onMapped: Array<() => void> = []
  private readonly onMapFailed = () => {}
  private readonly commandBuffers: GPUCommandBuffer[] = [null]
  private readonly writes: GPURenderPassTimestampWrites = {
    querySet: null,
    beginningOfPassWriteIndex: undefined,
    endOfPassWriteIndex: undefined,
  }
  private ring = 0
  private frame = 0
  private hasWrites = false

  public constructor() {
    for (let i = 0; i < RING_SIZE; i++) {
      this.pending.push(new Uint8Array(MAX_TIMERS))
      this.onMapped.push(() => this.read(i))
    }
  }

  /**
   * Creates the GPU resources. Called on each device (re)initialization
   */
  public setup(gpu: GPUDevice): void {
    this.destroy()
    this.gpu = gpu
    this.enabled = gpu.features.has('timestamp-query')
    if (!this.enabled) {
      return
    }
    this.querySet = gpu.createQuerySet({
      label: 'gglib timers',
      type: 'timestamp',
      count: MAX_TIMERS * 2,
    })
    this.resolveBuffer = gpu.createBuffer({
      label: 'gglib timers resolve',
      size: MAX_TIMERS * 16,
      usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
    })
    for (let i = 0; i < RING_SIZE; i++) {
      this.readback[i] = gpu.createBuffer({
        label: 'gglib timers readback',
        size: MAX_TIMERS * 16,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
      })
    }
    this.writes.querySet = this.querySet
  }

  /**
   * Creates a timer with the next free slot, or an inert timer if all slots are taken
   */
  public create(options?: GpuTimerOptions): GpuTimer {
    if (this.timers.length >= MAX_TIMERS) {
      return new GpuTimer(-1, options)
    }
    const timer = new GpuTimer(this.timers.length, options)
    this.timers.push(timer)
    return timer
  }

  /**
   * Gets the timestamp writes for a pass that is about to begin while the given timer is active
   *
   * @param timer the active timer
   * @param first whether this is the first pass of the timed region, only that one writes the begin timestamp
   * @returns the writes to assign to the pass descriptor, or undefined if timing is not possible
   */
  public getWrites(timer: GpuTimer, first: boolean): GPURenderPassTimestampWrites | undefined {
    if (!this.enabled || timer.index < 0) {
      return undefined
    }
    const writes = this.writes
    if (first) {
      writes.beginningOfPassWriteIndex = timer.index * 2
      this.written[timer.index] = 1
      this.hasWrites = true
    } else {
      writes.beginningOfPassWriteIndex = undefined
    }
    writes.endOfPassWriteIndex = timer.index * 2 + 1
    return writes
  }

  /**
   * Copies the timestamps of the current frame into a readback buffer and maps it.
   * Must be called after the last submit of the frame.
   */
  public resolve(): void {
    this.frame++
    if (!this.hasWrites) {
      return
    }
    this.hasWrites = false

    const ring = this.ring
    const buffer = this.readback[ring]
    if (!this.enabled || buffer.mapState !== 'unmapped') {
      this.drops++
      this.written.fill(0)
      return
    }

    const count = this.timers.length
    const size = count * 16
    const encoder = this.gpu.createCommandEncoder(RESOLVE_ENCODER)
    encoder.resolveQuerySet(this.querySet, 0, count * 2, this.resolveBuffer, 0)
    encoder.copyBufferToBuffer(this.resolveBuffer, 0, buffer, 0, size)
    this.commandBuffers[0] = encoder.finish()
    this.gpu.queue.submit(this.commandBuffers)
    this.commandBuffers[0] = null

    this.pending[ring].set(this.written)
    this.pendingCount[ring] = count
    this.pendingFrame[ring] = this.frame
    this.written.fill(0)
    this.ring = (ring + 1) % RING_SIZE
    buffer.mapAsync(GPUMapMode.READ, 0, size).then(this.onMapped[ring], this.onMapFailed)
  }

  private read(ring: number): void {
    const buffer = this.readback[ring]
    if (buffer?.mapState !== 'mapped') {
      // resources were recreated meanwhile
      return
    }
    const count = this.pendingCount[ring]
    const pending = this.pending[ring]
    const frame = this.pendingFrame[ring]
    // timestamps are u64 nanoseconds, combined from two u32 to avoid BigInt allocations
    const data = new Uint32Array(buffer.getMappedRange(0, count * 16))
    for (let i = 0; i < count; i++) {
      if (!pending[i]) {
        continue
      }
      const begin = data[i * 4 + 1] * 4294967296 + data[i * 4]
      const end = data[i * 4 + 3] * 4294967296 + data[i * 4 + 2]
      // equal values are valid, timestamps are quantized unless webgpu developer features are enabled
      if (begin > 0 && end >= begin) {
        this.timers[i].record((end - begin) / 1e6, frame)
      }
    }
    buffer.unmap()
  }

  public destroy(): void {
    this.querySet?.destroy()
    this.resolveBuffer?.destroy()
    for (const buffer of this.readback) {
      buffer?.destroy()
    }
    this.querySet = null
    this.resolveBuffer = null
    this.readback.length = 0
    this.writes.querySet = null
    this.enabled = false
    this.hasWrites = false
    this.written.fill(0)
  }
}
