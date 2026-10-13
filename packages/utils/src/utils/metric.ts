export interface MetricSamplerOptions {
  label?: string
  windowSize: number
}

export class MetricSampler {
  public label: string
  public current = 0
  public average = 0
  public min = 0
  public max = 0
  public sum = 0 // sum of last window
  public totalSamples = 0 // all-time count

  private accSum = 0
  private accMin = Infinity
  private accMax = -Infinity
  private count = 0
  private readonly windowSize: number

  public constructor(options?: MetricSamplerOptions) {
    this.label = options?.label ?? 'MetricSampler'
    this.windowSize = options?.windowSize ?? 60
  }

  public sample(value: number) {
    this.current = value
    this.totalSamples++
    this.accSum += value
    if (value < this.accMin) {
      this.accMin = value
    }
    if (value > this.accMax) {
      this.accMax = value
    }

    if (++this.count === this.windowSize) {
      this.average = this.accSum / this.count
      this.min = this.accMin
      this.max = this.accMax
      this.sum = this.accSum
      this.resetWindow()
    }
  }

  public reset() {
    this.current = this.average = this.min = this.max = this.sum = 0
    this.totalSamples = 0
    this.resetWindow()
  }

  private resetWindow() {
    this.accSum = 0
    this.accMin = Infinity
    this.accMax = -Infinity
    this.count = 0
  }
}
