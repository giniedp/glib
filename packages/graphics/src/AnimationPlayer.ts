import { AnimationData, AnimationTargetPose, AnimationDataChannel, AnimationDataChannels, AnimationDataChannelSample } from './AnimationData'
import { IVec3, IVec4, Vec3, Vec4, Quat } from '@gglib/math'

/**
 * @public
 */
export class AnimationPlayer {
  /**
   * The model that is being animated
   */
  public readonly data: AnimationData[]

  private clips: IAnimationClip[] = []

  public get clip(): IAnimationClip {
    return this.activeClip
  }

  private activeClip: IAnimationClip
  private looping: boolean
  constructor(data: AnimationData[]) {
    this.data = data
    for (const data of this.data) {
      this.clips.push(new AnimationChannelsSampler(data))
    }
  }

  public loadClip(indexOrName: string | number, looping: boolean = false) {
    this.activeClip = this.clips.find((it, i)  => it.name === indexOrName || i === indexOrName)
    this.looping = looping
    return this.clip
  }

  public sample(time: number, targets: AnimationTargetPose[]): boolean {
    const clip = this.clip
    if (!clip) {
      return false
    }
    if (this.looping) {
      time = time % clip.endTime
    } else {
      time = time >= clip.endTime ? clip.endTime : time
    }
    for (const i of clip.targets) {
      targets[i] = clip.sample(time, i, targets[i] || {})
    }
  }
}

export interface IAnimationClip {
  /**
   * Name of the animation clip
   */
  name: string
  /**
   * Start time of the clip
   */
  startTime: number
  /**
   * End time of the clip
   */
  endTime: number
  /**
   * Duration of the clip
   */
  duration: number
  /**
   * List of target ids that are animated
   */
  targets: number[]
  /**
   * Resolves a sample at given time for given target
   *
   * @param time - time in seconds
   * @param target - target id
   * @param out - where output is written to
   */
  sample(time: number, target: number, out?: AnimationTargetPose): AnimationTargetPose
}

export class AnimationChannelsSampler implements IAnimationClip {

  /**
   * The name of this animation
   */
  public readonly name: string

  /**
   * A map of targetId to its individual animation sampler
   */
  protected readonly channels: Map<number, AnimationChannelSampler>

  public readonly startTime: number
  public readonly endTime: number
  public readonly duration: number

  public readonly targets: number[]

  constructor(data: AnimationData) {
    if (!data.channels || !data.channels.length) {
      throw new Error('Invalid animation: no animation channels')
    }
    this.name = data.name
    this.channels = new Map()

    for (const channel of data.channels) {
      if (this.channels.has(channel.target)) {
        throw new Error(`Invalid animation: multiple channel sets for target ${channel.target} detected`)
      }
      this.channels.set(channel.target, new AnimationChannelSampler(channel))
    }
    this.targets = Array.from(this.channels.keys())

    let startTime: number
    let endTime: number
    this.channels.forEach((channel) => {
      if (startTime == null || channel.startTime < startTime) {
        startTime = channel.startTime
      }
      if (endTime == null || channel.endTime > endTime) {
        endTime = channel.endTime
      }
    })

    if (startTime == null || endTime == null) {
      throw new Error('invalid animation data')
    }
    this.startTime = startTime
    this.endTime = endTime
    this.duration = endTime - startTime
  }

  public sample(time: number, target: number, out: AnimationTargetPose): AnimationTargetPose {
    out.translation = out.translation ?? { x: 0, y: 0, z: 0 }
    out.rotation = out.rotation ?? { x: 0, y: 0, z: 0, w: 1 }
    out.scale = out.scale ?? { x: 1, y: 1, z: 1 }

    const channel = this.channels.get(target)
    if (channel) {
      channel.sample(time, out)
    }
    return out
  }
}

export class AnimationChannelSampler {
  /**
   * The target id (bone or node index)
   */
  public get target() {
    return this.data.target
  }

  /**
   * The animation data
   */
  public readonly data: AnimationDataChannels

  /**
   * Minimum start time in this animation data
   */
  public readonly startTime: number

  /**
   * Maximum end time in this animation data
   */
  public readonly endTime: number

  /**
   * Duration of this animation data
   */
  public readonly duration: number

  protected readonly position: AnimationChannelIndexer<IVec3>
  protected readonly rotation: AnimationChannelIndexer<IVec4>
  protected readonly scale: AnimationChannelIndexer<IVec3>

  public constructor(data: AnimationDataChannels) {
    this.data = data
    this.position = data.translation ? new AnimationChannelIndexer(data.translation) : null
    this.rotation = data.rotation ? new AnimationChannelIndexer(data.rotation) : null
    this.scale = data.scale ? new AnimationChannelIndexer(data.scale) : null

    if (!this.position && !this.rotation && !this.scale) {
      throw new Error('Invalid animation: channel set without channels detected')
    }

    this.startTime = Math.min(
      this.position ? this.position.startTime : Number.MAX_VALUE,
      this.rotation ? this.rotation.startTime : Number.MAX_VALUE,
      this.scale ? this.scale.startTime : Number.MAX_VALUE,
    )
    this.endTime = Math.max(
      this.position ? this.position.endTime : Number.MIN_VALUE,
      this.rotation ? this.rotation.endTime : Number.MIN_VALUE,
      this.scale ? this.scale.endTime : Number.MIN_VALUE,
    )
    this.duration = this.endTime - this.startTime

    if (this.duration < 0) {
      throw new Error('Invalid animation: channel set with negative duration')
    }
  }

  public sample(time: number, out: AnimationTargetPose) {
    if (this.position) {
      this.sampleVec3(time, this.position, out.translation)
    }
    if (this.rotation) {
      this.sampleVec4(time, this.rotation, out.rotation)
      Quat.normalize(out.rotation, out.rotation)
    }
    if (this.scale) {
      this.sampleVec3(time, this.scale, out.scale)
    }
  }

  private sampleVec3(time: number, indexer: AnimationChannelIndexer<IVec3>, out: IVec3) {
    const index = indexer.getIndex(time)
    const sample0 = indexer.samples[index]
    const sample1 = indexer.samples[index + 1]
    if (indexer.interpolation !== 'step' && sample1) {
      const d = sample1.time - sample0.time
      const t = d > 0 ? (time - sample0.time) / d : 0
      if (t > 0) {
        if (indexer.interpolation === 'linear') {
          Vec3.lerp(sample0.value, sample1.value, t, out)
        } else {
          Vec3.hermite(sample0.value, sample0.to, sample1.value, sample1.ti, t, out)
        }
        return
      }
    }
    Vec3.clone(sample0.value, out)
  }

  private sampleVec4(time: number, indexer: AnimationChannelIndexer<IVec4>, out: IVec4) {
    const index = indexer.getIndex(time)
    const sample0 = indexer.samples[index]
    const sample1 = indexer.samples[index + 1]
    if (indexer.interpolation !== 'step' && sample1) {
      const d = sample1.time - sample0.time
      const t = d > 0 ? (time - sample0.time) / d : 0
      if (t > 0) {
        if (indexer.interpolation === 'linear') {
          Vec4.lerp(sample0.value, sample1.value, t, out)
        } else {
          Vec4.hermite(sample0.value, sample0.to, sample1.value, sample1.ti, t, out)
        }
        return
      }
    }
    Vec4.clone(sample0.value, out)
  }
}

export class AnimationChannelIndexer<T extends IVec3 | IVec4> {
  public readonly samples: AnimationDataChannelSample<T>[]
  public readonly interpolation: 'step' | 'linear' | 'cubic'

  public readonly startTime: number
  public readonly endTime: number
  public readonly duration: number

  private resolution = 0.016 // 16ms
  private timeToSample: number[] = []

  constructor(data: AnimationDataChannel<any>) {

    const samples = data?.samples
    if (!samples || !samples.length) {
      throw new Error('Invalid animation: channel has no samples')
    }

    this.samples = samples
    this.interpolation = data.interpolation
    this.startTime = samples[0].time
    this.endTime = samples[samples.length - 1].time
    this.duration = this.endTime - this.startTime

    if (this.duration < 0) {
      throw new Error('Invalid animation: channel with negative duration')
    }
    const timeSamples = Math.ceil(this.duration / this.resolution) + 1
    for (let i = 0; i < timeSamples; i++) {
      const time = this.startTime + i * this.resolution
      let j = samples.length - 1
      for (; j > 0; j--) {
        if (samples[j].time <= time) {
          break
        }
      }
      this.timeToSample[i] = j
    }
  }

  public getIndex(time: number) {
    time -= this.startTime
    if (time <= 0) {
      return 0
    }
    const index = Math.round(time / this.resolution)
    return this.timeToSample[Math.min(index, this.timeToSample.length - 1)]
  }
}

