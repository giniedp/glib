
export class Animation {
  public channels: AnimationChannel[]
  public samplers: AnimationSampler[]

  private $time: number
  public get time() {
    return this.$time
  }

  public set time(value: number) {
    this.setTime(value)
  }

  public update(dt: number) {
    this.setTime(this.$time + dt)
  }

  private setTime(time: number) {
    let duration = 0
    for (const channel of this.channels) {
      duration = channel.end > duration ? channel.end : duration
    }
    if (duration <= 0) {
      this.$time = 0
      return
    }

    while (time < duration) {
      time += duration
    }
    while (time >= duration) {
      time -= duration
    }

    for (const channel of this.channels) {
      if (time >= channel.start && time <= channel.end) {
        const sampler = this.samplers[channel.sampler]
        sampler.sample(time)
        for (const receiver of channel.targets) {
          receiver.applyAnimationSample(sampler.property, sampler.frame)
        }
      }
    }
    this.time = time
  }
}

export interface AnimationReceiver {
  applyAnimationSample: (property: string, sample: ReadonlyArray<number>) => void
}

export class AnimationChannel {
  /**
   * A user defined name for this channel
   */
  public name: string
  /**
   * The sampler
   */
  public sampler: number
  /**
   * The start time
   */
  public start: number
  /**
   * The end time
   */
  public end: number

  /**
   *
   */
  public targets: AnimationReceiver[] = []
}

export class AnimationSampler {
  /**
   * The input samples (keyframe time)
   */
  public source: ReadonlyArray<number>

  /**
   * The input samples (keyframe time)
   */
  public data: ReadonlyArray<number>

  /**
   * Number of elements per animation sample
   */
  public elementCount: number

  /**
   * The property to animate
   */
  public property: 'translation' | 'rotation' | 'scale' | 'weights' | string

  /**
   * The animation frame that has been resolved during the last sample access
   */
  public readonly frame: number[] = []

  private readonly s1: number[] = []
  private readonly s2: number[] = []

  public constructor(source: ReadonlyArray<number>, data: ReadonlyArray<number>, elementCount: number) {
    this.source = source
    this.data = data
    this.elementCount = elementCount
    this.frame.length = elementCount
    this.s1.length = elementCount
    this.s2.length = elementCount
  }

  public interpolation: (t: number) => number = (it) => it

  public sample(time: number) {
    let l = 0
    let r = 0
    for (let i = 0; i < this.source.length - 1; i++) {
      let next = this.source[i + 1]
      l = r
      r = i
      if (next > time) {
        break
      }
    }
    const lv = this.source[l]
    const rv = this.source[r]
    const range = (rv - lv)
    let t = 0
    if (range > 0) {
      t = this.interpolation((time - lv) / range)
    }

    for (let i = 0; i < this.elementCount; i++) {
      this.frame[i] = this.getComponent(i, l, r, t)
    }
  }

  private getComponent(i: number, l: number, r: number, t: number): number {
    if (i >= this.elementCount) {
      return 0
    }
    const a = this.data[l * this.elementCount + i]
    const b = this.data[r * this.elementCount + i]
    return a + (b - a) * t
  }
}
