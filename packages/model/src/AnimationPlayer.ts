import {
  type IVec3,
  type IVec4,
  quatSlerp,
  type Transform,
  vec3$init,
  vec3$initFrom,
  vec4$init,
  vec4$initFrom,
  vec4$normalize,
} from '@gglib/math'
import type {
  AnimationData,
  AnimationDataChannel,
  AnimationDataChannelSample,
  AnimationDataChannels,
  AnimationInterpolation,
} from './AnimationData'

/**
 * @public
 */
export interface AnimationPlayOptions {
  /**
   * Whether the clip restarts when it reaches its end. Default is `false`
   */
  loop?: boolean
  /**
   * Playback speed factor, negative values play backwards. Default is `1`
   */
  speed?: number
  /**
   * Time in seconds to start at. Default is `0`, or the clip duration when playing backwards
   */
  time?: number
}

/**
 * Plays animation clips on a set of transforms
 *
 * @public
 *
 * @remarks
 * Clips address their targets by index, the targets of a model are its {@link Model.transformNodes}.
 * Use {@link Model.createAnimationPlayer} to create a player for a model.
 *
 * Sampled values are written to the targets, which are then marked as changed.
 * Targets that are not animated by the clip keep their current state.
 *
 * @example
 * ```ts
 * const player = model.createAnimationPlayer()
 * player.play('Walk', { loop: true })
 * // each frame
 * player.update(dt)
 * ```
 */
export class AnimationPlayer {
  /**
   * The clips that can be played
   */
  public readonly clips: ReadonlyArray<AnimationClip>

  /**
   * The transforms that are animated, addressed by {@link AnimationClipTarget.target}
   */
  public readonly targets: ReadonlyArray<Transform>

  /**
   * The current clip, `null` if nothing has been played yet
   */
  public clip: AnimationClip | null = null

  /**
   * The current time in seconds on the timeline of the current clip
   */
  public time: number = 0

  /**
   * Playback speed factor, negative values play backwards
   */
  public speed: number = 1

  /**
   * Whether the clip restarts when it reaches its end
   */
  public loop: boolean = false

  /**
   * Whether {@link update} advances the time
   */
  public playing: boolean = false

  /**
   * Indices of the targets that are animated by any of the clips
   */
  private readonly restTargets: number[] = []

  /**
   * Translation, rotation and scale of the {@link restTargets} at construction, 10 values per target
   */
  private readonly restPose: Float32Array

  /**
   * @param clips - the clips to play, data is converted to clips. Pass clips to share them, see {@link Model.clips}
   * @param targets - the transforms to animate. Their current state is captured as rest pose, see {@link reset}
   */
  public constructor(clips: ReadonlyArray<AnimationData | AnimationClip>, targets: ReadonlyArray<Transform>) {
    this.clips = clips.map((it) => (it instanceof AnimationClip ? it : new AnimationClip(it)))
    this.targets = targets
    for (const clip of this.clips) {
      for (const channels of clip.channels) {
        if (!targets[channels.target]) {
          console.warn(`AnimationPlayer: clip '${clip.name}' animates target ${channels.target} which does not exist`)
        } else if (!this.restTargets.includes(channels.target)) {
          this.restTargets.push(channels.target)
        }
      }
    }
    this.restPose = new Float32Array(this.restTargets.length * 10)
    for (let i = 0, o = 0; i < this.restTargets.length; i++, o += 10) {
      const { translation: t, rotation: r, scale: s } = targets[this.restTargets[i]]
      this.restPose.set([t.x, t.y, t.z, r.x, r.y, r.z, r.w, s.x, s.y, s.z], o)
    }
  }

  /**
   * Finds a clip by name or index
   */
  public getClip(nameOrIndex: string | number): AnimationClip | null {
    if (typeof nameOrIndex === 'number') {
      return this.clips[nameOrIndex] ?? null
    }
    return this.clips.find((it) => it.name === nameOrIndex) ?? null
  }

  /**
   * Starts playing a clip and applies its first pose
   *
   * @remarks
   * Targets that are not animated by the clip keep their current state,
   * call {@link reset} before to switch from a clip that animates other targets.
   *
   * @returns the clip, or `null` if no clip was found
   */
  public play(nameOrIndex: string | number, options?: AnimationPlayOptions): AnimationClip | null {
    const clip = this.getClip(nameOrIndex)
    if (!clip) {
      console.warn(`AnimationPlayer: clip '${nameOrIndex}' not found`)
      return null
    }
    this.clip = clip
    this.loop = options?.loop ?? false
    this.speed = options?.speed ?? 1
    this.time = options?.time ?? (this.speed < 0 ? clip.duration : 0)
    this.playing = true
    this.apply()
    return clip
  }

  /**
   * Stops advancing the time, the current pose is kept
   */
  public stop() {
    this.playing = false
  }

  /**
   * Stops playing and restores the rest pose of all targets that are animated by any of the clips
   *
   * @remarks
   * The rest pose is the state of the targets when the player was created.
   */
  public reset() {
    this.playing = false
    const pose = this.restPose
    for (let i = 0, o = 0; i < this.restTargets.length; i++, o += 10) {
      const target = this.targets[this.restTargets[i]]
      vec3$init(target.translation, pose[o], pose[o + 1], pose[o + 2])
      vec4$init(target.rotation, pose[o + 3], pose[o + 4], pose[o + 5], pose[o + 6])
      vec3$init(target.scale, pose[o + 7], pose[o + 8], pose[o + 9])
      target.markAsChanged()
    }
  }

  /**
   * Advances the time of a playing clip and applies the pose
   *
   * @remarks
   * A clip that does not loop stops playing when it reaches its end.
   *
   * @param dt - elapsed time in seconds
   */
  public update(dt: number) {
    const clip = this.clip
    if (!this.playing || !clip) {
      return
    }
    let time = this.time + dt * this.speed
    if (time > clip.duration || time < 0) {
      if (this.loop && clip.duration > 0) {
        time = mod(time, clip.duration)
      } else {
        time = time > clip.duration ? clip.duration : 0
        this.playing = false
      }
    }
    this.time = time
    this.apply()
  }

  /**
   * Applies the pose of the current clip at the current time to the targets
   */
  public apply() {
    this.clip?.sample(this.time, this.targets)
  }
}

/**
 * Samples an animation clip
 *
 * @public
 *
 * @remarks
 * Holds no playback state and can be shared between players.
 */
export class AnimationClip {
  /**
   * The name of the clip
   */
  public readonly name: string

  /**
   * The animated targets of the clip
   */
  public readonly channels: ReadonlyArray<AnimationClipTarget>

  /**
   * Duration of the clip in seconds, the time of the last key frame
   *
   * @remarks
   * As defined by glTF, the timeline of a clip starts at `0`, key frame times are relative to that.
   * Before its first key frame, a channel holds the value of the first key frame.
   */
  public readonly duration: number

  public constructor(data: AnimationData) {
    if (!data.channels?.length) {
      throw new Error(`Invalid animation '${data.name}': no animation channels`)
    }
    const targets = new Set<number>()
    for (const channels of data.channels) {
      if (targets.has(channels.target)) {
        throw new Error(`Invalid animation '${data.name}': multiple channel sets for target ${channels.target}`)
      }
      targets.add(channels.target)
    }
    this.name = data.name
    this.channels = data.channels.map((it) => new AnimationClipTarget(it))
    this.duration = Math.max(0, ...this.channels.map((it) => it.endTime))
  }

  /**
   * Samples the clip at the given time and writes the values to the targets
   *
   * @param time - time in seconds on the timeline of the clip
   * @param targets - the transforms addressed by {@link AnimationClipTarget.target}
   */
  public sample(time: number, targets: ReadonlyArray<Transform>) {
    for (const channels of this.channels) {
      const target = targets[channels.target]
      if (target) {
        channels.sample(time, target)
      }
    }
  }
}

/**
 * Samples the channels of a single target
 *
 * @public
 */
export class AnimationClipTarget {
  /**
   * The target index (node or bone index)
   */
  public readonly target: number

  public readonly translation: AnimationChannel<IVec3> | null
  public readonly rotation: AnimationChannel<IVec4> | null
  public readonly scale: AnimationChannel<IVec3> | null

  /**
   * Time of the first key frame in seconds
   */
  public readonly startTime: number

  /**
   * Time of the last key frame in seconds
   */
  public readonly endTime: number

  public constructor(data: AnimationDataChannels) {
    this.target = data.target
    this.translation = data.translation ? new AnimationChannel(data.translation) : null
    this.rotation = data.rotation ? new AnimationChannel(data.rotation) : null
    this.scale = data.scale ? new AnimationChannel(data.scale) : null

    const channels = [this.translation, this.rotation, this.scale].filter((it) => !!it)
    if (!channels.length) {
      throw new Error(`Invalid animation: target ${data.target} has no channels`)
    }
    this.startTime = Math.min(...channels.map((it) => it.startTime))
    this.endTime = Math.max(...channels.map((it) => it.endTime))
  }

  /**
   * Samples all channels at the given time, writes the values to the target and marks it as changed
   */
  public sample(time: number, target: Transform) {
    this.translation?.sampleVec3(time, target.translation)
    this.rotation?.sampleQuat(time, target.rotation)
    this.scale?.sampleVec3(time, target.scale)
    target.markAsChanged()
  }
}

/**
 * Samples the key frames of a single animated property
 *
 * @public
 */
export class AnimationChannel<T extends IVec3 | IVec4> {
  /**
   * The key frames, ordered by time
   */
  public readonly samples: ReadonlyArray<AnimationDataChannelSample<T>>

  /**
   * The interpolation between key frames
   */
  public readonly interpolation: AnimationInterpolation

  /**
   * Time of the first key frame in seconds
   */
  public readonly startTime: number

  /**
   * Time of the last key frame in seconds
   */
  public readonly endTime: number

  /**
   * Index of the last found key frame, the next lookup starts there
   */
  private cursor = 0

  public constructor(data: AnimationDataChannel<T>) {
    const samples = data?.samples
    if (!samples?.length) {
      throw new Error('Invalid animation: channel has no samples')
    }
    for (let i = 1; i < samples.length; i++) {
      if (samples[i].time < samples[i - 1].time) {
        throw new Error('Invalid animation: channel samples are not ordered by time')
      }
    }
    const isCubic = data.interpolation === 'CUBICSPLINE'
    if (isCubic && samples.some((it) => !it.inTangent || !it.outTangent)) {
      throw new Error('Invalid animation: cubic channel samples without tangents')
    }
    this.samples = samples
    this.interpolation = data.interpolation
    this.startTime = samples[0].time
    this.endTime = samples[samples.length - 1].time
  }

  /**
   * Finds the key frame at the given time
   *
   * @returns the index of the last key frame with a time less or equal to the given time,
   * `0` if the time is before the first key frame
   */
  public frame(time: number): number {
    const samples = this.samples
    const last = samples.length - 1
    let i = this.cursor
    // fast path: same or next key frame as in the previous lookup
    if (samples[i].time <= time && (i === last || time < samples[i + 1].time)) {
      return i
    }
    if (i < last && samples[i + 1].time <= time && (i + 1 === last || time < samples[i + 2].time)) {
      return (this.cursor = i + 1)
    }
    if (time <= samples[0].time) {
      return (this.cursor = 0)
    }
    if (time >= samples[last].time) {
      return (this.cursor = last)
    }
    // binary search, samples[lo].time <= time < samples[hi].time
    let lo = 0
    let hi = last
    while (hi - lo > 1) {
      i = (lo + hi) >> 1
      if (samples[i].time <= time) {
        lo = i
      } else {
        hi = i
      }
    }
    return (this.cursor = lo)
  }

  /**
   * Samples a vector channel
   */
  public sampleVec3(time: number, out: IVec3): IVec3 {
    const i = this.frame(time)
    const s0 = this.samples[i] as AnimationDataChannelSample<IVec3>
    const s1 = this.samples[i + 1] as AnimationDataChannelSample<IVec3>
    const dt = s1 ? s1.time - s0.time : 0
    if (this.interpolation === 'STEP' || dt <= 0 || time <= s0.time) {
      return vec3$initFrom(out, s0.value)
    }
    const t = (time - s0.time) / dt
    if (this.interpolation === 'LINEAR') {
      out.x = s0.value.x + (s1.value.x - s0.value.x) * t
      out.y = s0.value.y + (s1.value.y - s0.value.y) * t
      out.z = s0.value.z + (s1.value.z - s0.value.z) * t
      return out
    }
    out.x = cubicSpline(s0.value.x, s0.outTangent.x, s1.value.x, s1.inTangent.x, t, dt)
    out.y = cubicSpline(s0.value.y, s0.outTangent.y, s1.value.y, s1.inTangent.y, t, dt)
    out.z = cubicSpline(s0.value.z, s0.outTangent.z, s1.value.z, s1.inTangent.z, t, dt)
    return out
  }

  /**
   * Samples a rotation channel. Linear interpolation is spherical, the result is normalized
   */
  public sampleQuat(time: number, out: IVec4): IVec4 {
    const i = this.frame(time)
    const s0 = this.samples[i] as AnimationDataChannelSample<IVec4>
    const s1 = this.samples[i + 1] as AnimationDataChannelSample<IVec4>
    const dt = s1 ? s1.time - s0.time : 0
    if (this.interpolation === 'STEP' || dt <= 0 || time <= s0.time) {
      vec4$initFrom(out, s0.value)
    } else if (this.interpolation === 'LINEAR') {
      quatSlerp(s0.value, s1.value, (time - s0.time) / dt, out)
    } else {
      const t = (time - s0.time) / dt
      out.x = cubicSpline(s0.value.x, s0.outTangent.x, s1.value.x, s1.inTangent.x, t, dt)
      out.y = cubicSpline(s0.value.y, s0.outTangent.y, s1.value.y, s1.inTangent.y, t, dt)
      out.z = cubicSpline(s0.value.z, s0.outTangent.z, s1.value.z, s1.inTangent.z, t, dt)
      out.w = cubicSpline(s0.value.w, s0.outTangent.w, s1.value.w, s1.inTangent.w, t, dt)
    }
    return vec4$normalize(out)
  }
}

/**
 * Cubic hermite spline as defined by glTF, tangents are scaled by the key frame delta time
 *
 * @param p0 - value at the first key frame
 * @param b0 - out tangent of the first key frame
 * @param p1 - value at the second key frame
 * @param a1 - in tangent of the second key frame
 * @param t - interpolation value in range [0:1]
 * @param dt - time between the key frames in seconds
 */
function cubicSpline(p0: number, b0: number, p1: number, a1: number, t: number, dt: number) {
  const t2 = t * t
  const t3 = t2 * t
  return (
    (2 * t3 - 3 * t2 + 1) * p0 + (t3 - 2 * t2 + t) * dt * b0 + (-2 * t3 + 3 * t2) * p1 + (t3 - t2) * dt * a1
  )
}

function mod(a: number, b: number) {
  return ((a % b) + b) % b
}
