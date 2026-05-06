import { type ITransformBase, type IVec3, type IVec4, Quat, Vec3, Vec4 } from '@gglib/math'
import type {
  AnimationData,
  AnimationDataChannel,
  AnimationDataChannels,
  AnimationDataChannelSample,
} from './AnimationData'

/**
 * @public
 */
export class AnimationPlayer {
  private clips: AnimationSampler[] = []

  public get clip(): AnimationSampler {
    return this.activeClip
  }

  private activeClip: AnimationSampler
  private looping: boolean

  constructor(animations: ReadonlyArray<AnimationData>) {
    for (const data of animations) {
      this.clips.push(new AnimationSampler(data))
    }
  }

  public loadClip(indexOrName: string | number, looping: boolean = false) {
    this.activeClip = this.clips.find((it, i) => it.name === indexOrName || i === indexOrName)
    this.looping = looping
    return this.clip
  }

  public sample(time: number, targets: ITransformBase[]): boolean {
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
      if (!targets[i]) {
        console.warn(`AnimationPlayer: target ${i} is not defined in targets array`)
      } else {
        clip.sample(time, i, targets[i])
      }
    }
    return true
  }
}

export class AnimationSampler {
  /**
   * The name of this animation
   */
  public readonly name: string

  /**
   * A map of targetId to its individual animation sampler
   */
  protected readonly channels: Map<number, AnimationChannelSampler>

  /**
   * Start time of the clip
   */
  public readonly startTime: number

  /**
   * End time of the clip
   */
  public readonly endTime: number

  /**
   * Duration of the clip
   */
  public readonly duration: number

  /**
   * Target node id's that are animated by this clip
   */
  public readonly targets: number[]

  public constructor(data: AnimationData) {
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

  public sample(time: number, target: number, out: ITransformBase) {
    out.translation = out.translation ?? { x: 0, y: 0, z: 0 }
    out.rotation = out.rotation ?? { x: 0, y: 0, z: 0, w: 1 }
    out.scale = out.scale ?? { x: 1, y: 1, z: 1 }

    const channel = this.channels.get(target)
    if (channel) {
      channel.sample(time, out)
    }
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

  protected readonly position: AnimationChannel<IVec3>
  protected readonly rotation: AnimationChannel<IVec4>
  protected readonly scale: AnimationChannel<IVec3>

  public constructor(data: AnimationDataChannels) {
    this.data = data
    this.position = data.translation ? new AnimationChannel(data.translation) : null
    this.rotation = data.rotation ? new AnimationChannel(data.rotation) : null
    this.scale = data.scale ? new AnimationChannel(data.scale) : null

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

  public sample(time: number, target: ITransformBase) {
    if (this.position) {
      this.sampleVec3(time, this.position, target.translation)
    }
    if (this.rotation) {
      this.sampleVec4(time, this.rotation, target.rotation)
      Quat.normalize(target.rotation, target.rotation)
    }
    if (this.scale) {
      this.sampleVec3(time, this.scale, target.scale)
    }
  }

  private sampleVec3(time: number, indexer: AnimationChannel<IVec3>, out: IVec3) {
    const frame = indexer.frame(time)
    const sample0 = indexer.samples[frame]
    const sample1 = indexer.samples[frame + 1]
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

  private sampleVec4(time: number, channel: AnimationChannel<IVec4>, out: IVec4) {
    const frame = channel.frame(time)
    const sample0 = channel.samples[frame]
    const sample1 = channel.samples[frame + 1]
    if (channel.interpolation !== 'step' && sample1) {
      const d = sample1.time - sample0.time
      const t = d > 0 ? (time - sample0.time) / d : 0
      if (t > 0) {
        if (channel.interpolation === 'linear') {
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

export class AnimationChannel<T extends IVec3 | IVec4> {
  public readonly samples: AnimationDataChannelSample<T>[]
  public readonly interpolation: 'step' | 'linear' | 'cubic'

  public readonly startTime: number
  public readonly endTime: number
  public readonly duration: number

  private resolution = 0.016 // 16ms
  private timeToSample: number[] = []

  public constructor(data: AnimationDataChannel<any>) {
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

  public frame(time: number) {
    time -= this.startTime
    if (time <= 0) {
      return 0
    }
    const index = Math.round(time / this.resolution)
    return this.timeToSample[Math.min(index, this.timeToSample.length - 1)]
  }
}
