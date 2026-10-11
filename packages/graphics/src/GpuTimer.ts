export interface GpuTimerOptions {
  /**
   * Display name of the timer
   */
  name?: string
  /**
   * Number of frames used for {@link GpuTimer.average} and {@link GpuTimer.max}. Defaults to 60
   */
  historySize?: number
}

/**
 * Measures the GPU time of a region of passes, see {@link RenderEncoder.beginTimer}
 *
 * @remarks
 * Results arrive a few frames late, after the device has read back the timestamps.
 * A timer with a negative index is inert, e.g. when the backend has no timestamp support.
 */
export class GpuTimer {
  /**
   * Display name of the timer
   */
  public readonly name: string

  /**
   * Slot of this timer in the device query set, negative if the timer is inert
   */
  public readonly index: number

  /**
   * Latest measured time in ms
   */
  public time = 0

  /**
   * Average time in ms over the history window
   */
  public average = 0

  /**
   * Maximum time in ms over the history window
   */
  public max = 0

  /**
   * Frame id of the latest measurement, -1 if nothing was measured yet
   */
  public frame = -1

  /**
   * Ring buffer of measured times in ms
   */
  public readonly history: Float32Array

  private historyIndex = 0
  private historyCount = 0

  public constructor(index: number, options?: GpuTimerOptions) {
    this.index = index
    this.name = options?.name ?? 'GPU Timer'
    this.history = new Float32Array(Math.max(1, options?.historySize ?? 60))
  }

  /**
   * Records a measurement. Called by the device when timestamps are read back
   */
  public record(ms: number, frame: number): void {
    const history = this.history
    this.time = ms
    this.frame = frame
    history[this.historyIndex] = ms
    this.historyIndex = (this.historyIndex + 1) % history.length
    this.historyCount = Math.min(this.historyCount + 1, history.length)

    let sum = 0
    let max = 0
    for (let i = 0; i < this.historyCount; i++) {
      sum += history[i]
      max = Math.max(max, history[i])
    }
    this.average = sum / this.historyCount
    this.max = max
  }

  /**
   * Clears all measurements
   */
  public reset(): void {
    this.time = 0
    this.average = 0
    this.max = 0
    this.frame = -1
    this.history.fill(0)
    this.historyIndex = 0
    this.historyCount = 0
  }
}
