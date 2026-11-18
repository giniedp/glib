import type { AnimationData } from '../AnimationData'
import type { AnimationPose } from './AnimationPose'

/**
 * The transform channel a track animates
 *
 * @public
 */
export type AnimationTrackChannel = 'translation' | 'rotation' | 'scale'

/**
 * Key frames of one channel of one target, packed
 *
 * @public
 */
export interface AnimationTrack {
  /**
   * The target in the clip's own numbering (a node index for glTF, a controller slot for Cry). An
   * {@link AnimationClipBinding} maps it to a joint of a rig.
   */
  readonly target: number
  readonly channel: AnimationTrackChannel
  /**
   * Key times, ascending, in the clip's time unit (see {@link AnimationTrackClip.rate})
   */
  readonly times: Float32Array
  /**
   * 3 values per key for translation and scale, 4 (x y z w) for rotation
   */
  readonly values: Float32Array
  readonly interpolation: 'STEP' | 'LINEAR'
}

/**
 * An animation clip with packed key frames, for the {@link AnimationMixer}
 *
 * @public
 *
 * @remarks
 * Shared by everyone who plays it, holds no playback state. Sampling follows the game's controller sampling:
 * the first key before the first key time, the last key after the last key time, rotations by normalized lerp in the
 * hemisphere of the first key, translations and scales by lerp.
 */
export class AnimationTrackClip {
  public readonly name: string
  public readonly tracks: ReadonlyArray<AnimationTrack>
  /**
   * The first played time, in the track time unit
   */
  public readonly start: number
  /**
   * The last played time, in the track time unit
   */
  public readonly end: number
  /**
   * Track time units per second, e.g. frames per second for Cry clips, 1 for seconds
   */
  public readonly rate: number
  /**
   * The values are deltas that compose onto a pose instead of replacing it
   */
  public readonly additive: boolean

  /**
   * Seconds from {@link start} to {@link end}
   */
  public get duration(): number {
    return (this.end - this.start) / this.rate
  }

  public constructor(options: {
    name?: string
    tracks: AnimationTrack[]
    start?: number
    end?: number
    rate?: number
    additive?: boolean
  }) {
    this.name = options.name ?? ''
    this.tracks = options.tracks
    // a rate of 0 or less has no meaning, it falls back to seconds
    this.rate = options.rate > 0 ? options.rate : 1
    this.additive = !!options.additive
    let first = Infinity
    let last = -Infinity
    for (const track of options.tracks) {
      if (track.times.length) {
        first = Math.min(first, track.times[0])
        last = Math.max(last, track.times[track.times.length - 1])
      }
    }
    this.start = options.start ?? (Number.isFinite(first) ? Math.min(0, first) : 0)
    this.end = Math.max(this.start, options.end ?? (Number.isFinite(last) ? last : 0))
  }

  /**
   * The time in track units for a normalized time (0 at {@link start}, 1 at {@link end})
   */
  public timeAt(normalized: number): number {
    return this.start + normalized * (this.end - this.start)
  }

  /**
   * Converts glTF style animation data (times in seconds, objects per key) to a packed clip
   *
   * @remarks
   * CUBICSPLINE channels are sampled linearly between their keys (the tangents are dropped).
   */
  public static fromData(data: AnimationData): AnimationTrackClip {
    const tracks: AnimationTrack[] = []
    for (const target of data.channels) {
      for (const channel of ['translation', 'rotation', 'scale'] as const) {
        const source = target[channel]
        if (!source?.samples?.length) {
          continue
        }
        const size = channel === 'rotation' ? 4 : 3
        const times = new Float32Array(source.samples.length)
        const values = new Float32Array(source.samples.length * size)
        source.samples.forEach((sample, i) => {
          times[i] = sample.time
          const value = sample.value as { x: number; y: number; z: number; w?: number }
          values[i * size] = value.x
          values[i * size + 1] = value.y
          values[i * size + 2] = value.z
          if (size === 4) {
            values[i * size + 3] = value.w ?? 1
          }
        })
        tracks.push({
          target: target.target,
          channel,
          times,
          values,
          interpolation: source.interpolation === 'STEP' ? 'STEP' : 'LINEAR',
        })
      }
    }
    return new AnimationTrackClip({ name: data.name, tracks, start: 0, rate: 1 })
  }
}

/**
 * Maps the tracks of a clip onto the joints of a rig
 *
 * @public
 */
export interface AnimationClipBinding {
  readonly clip: AnimationTrackClip
  /**
   * The joint of each track, -1 for a track whose target the rig does not have
   */
  readonly joints: Int16Array
}

/**
 * The joints a bound clip has tracks for (1), the others 0; the mask ends at the highest such joint
 *
 * @public
 */
export function clipBindingMask(binding: AnimationClipBinding): Uint8Array {
  let count = 0
  for (const joint of binding.joints) {
    count = Math.max(count, joint + 1)
  }
  const mask = new Uint8Array(count)
  for (const joint of binding.joints) {
    if (joint >= 0) {
      mask[joint] = 1
    }
  }
  return mask
}

/**
 * The joints any of the masks selects (e.g. the clips of a blend space)
 *
 * @public
 */
export function jointMaskUnion(masks: ReadonlyArray<Uint8Array>): Uint8Array {
  let count = 0
  for (const mask of masks) {
    count = Math.max(count, mask.length)
  }
  const result = new Uint8Array(count)
  for (const mask of masks) {
    for (let j = 0; j < mask.length; j++) {
      if (mask[j]) {
        result[j] = 1
      }
    }
  }
  return result
}

/**
 * The playback state of one clip: the key index each track found last, so the next lookup starts there
 *
 * @public
 *
 * @remarks
 * One per playing entry, the clip itself is shared and stateless.
 */
export class AnimationClipCursor {
  public readonly keys: Int32Array
  public constructor(clip: AnimationTrackClip) {
    this.keys = new Int32Array(clip.tracks.length)
  }
}

/**
 * Samples a clip into a pose: each bound track writes its channel of its joint, joints and channels the clip does not
 * animate keep what the pose holds
 *
 * @public
 *
 * @remarks
 * Start `out` from the rig's default pose to get the game's behavior (absent controllers keep their default).
 * An additive clip composes onto `out` (`rotation = sample * out.rotation`, `translation = sample + out.translation`,
 * Cry `SampleAddAnimFull`), unless `delta` is set: then it writes the raw deltas, for additive layers that start
 * from the identity pose.
 *
 * @param time - in the clip's track time unit, see {@link AnimationTrackClip.timeAt}
 */
export function sampleClip(
  binding: AnimationClipBinding,
  cursor: AnimationClipCursor,
  time: number,
  out: AnimationPose,
  delta = false,
) {
  const clip = binding.clip
  const compose = clip.additive && !delta
  const tracks = clip.tracks
  for (let i = 0; i < tracks.length; i++) {
    const joint = binding.joints[i]
    if (joint < 0) {
      continue
    }
    const track = tracks[i]
    const key = findKey(track.times, time, cursor.keys[i])
    cursor.keys[i] = key
    switch (track.channel) {
      case 'rotation':
        sampleRotation(track, key, time, out.rotations, joint * 4, compose)
        break
      case 'translation':
        sampleVector(track, key, time, out.translations, joint * 3, compose, false)
        break
      case 'scale':
        if (out.scales) {
          sampleVector(track, key, time, out.scales, joint * 3, compose, true)
        }
        break
    }
  }
}

/**
 * The index of the last key at or before the time, 0 before the first key. Starts at the previous key.
 */
function findKey(times: Float32Array, time: number, hint: number): number {
  const last = times.length - 1
  if (last <= 0 || time <= times[0]) {
    return 0
  }
  if (time >= times[last]) {
    return last
  }
  let i = hint > 0 && hint < last ? hint : 0
  if (times[i] <= time && time < times[i + 1]) {
    return i
  }
  if (i + 1 < last && times[i + 1] <= time && time < times[i + 2]) {
    return i + 1
  }
  // binary search, times[lo] <= time < times[hi]
  let lo = 0
  let hi = last
  while (hi - lo > 1) {
    i = (lo + hi) >> 1
    if (times[i] <= time) {
      lo = i
    } else {
      hi = i
    }
  }
  return lo
}

function sampleRotation(
  track: AnimationTrack,
  key: number,
  time: number,
  out: Float32Array,
  r: number,
  compose: boolean,
) {
  const v = track.values
  const k0 = key * 4
  let x = v[k0]
  let y = v[k0 + 1]
  let z = v[k0 + 2]
  let w = v[k0 + 3]
  const t0 = track.times[key]
  const t1 = track.times[key + 1]
  if (track.interpolation === 'LINEAR' && key + 1 < track.times.length && time > t0 && t1 > t0) {
    const amount = (time - t0) / (t1 - t0)
    const k1 = k0 + 4
    const dot = x * v[k1] + y * v[k1 + 1] + z * v[k1 + 2] + w * v[k1 + 3]
    const b = dot < 0 ? -amount : amount
    const a = 1 - amount
    x = x * a + v[k1] * b
    y = y * a + v[k1 + 1] * b
    z = z * a + v[k1 + 2] * b
    w = w * a + v[k1 + 3] * b
    const lengthSq = x * x + y * y + z * z + w * w
    if (lengthSq > 1e-12) {
      const inv = 1 / Math.sqrt(lengthSq)
      x *= inv
      y *= inv
      z *= inv
      w *= inv
    }
  }
  if (compose) {
    // sample * out
    const qx = out[r]
    const qy = out[r + 1]
    const qz = out[r + 2]
    const qw = out[r + 3]
    out[r] = x * qw + qx * w + y * qz - z * qy
    out[r + 1] = y * qw + qy * w + z * qx - x * qz
    out[r + 2] = z * qw + qz * w + x * qy - y * qx
    out[r + 3] = w * qw - x * qx - y * qy - z * qz
    return
  }
  out[r] = x
  out[r + 1] = y
  out[r + 2] = z
  out[r + 3] = w
}

function sampleVector(
  track: AnimationTrack,
  key: number,
  time: number,
  out: Float32Array,
  t: number,
  compose: boolean,
  multiply: boolean,
) {
  const v = track.values
  const k0 = key * 3
  let x = v[k0]
  let y = v[k0 + 1]
  let z = v[k0 + 2]
  const t0 = track.times[key]
  const t1 = track.times[key + 1]
  if (track.interpolation === 'LINEAR' && key + 1 < track.times.length && time > t0 && t1 > t0) {
    const amount = (time - t0) / (t1 - t0)
    const k1 = k0 + 3
    x += (v[k1] - x) * amount
    y += (v[k1 + 1] - y) * amount
    z += (v[k1 + 2] - z) * amount
  }
  if (!compose) {
    out[t] = x
    out[t + 1] = y
    out[t + 2] = z
  } else if (multiply) {
    out[t] *= x
    out[t + 1] *= y
    out[t + 2] *= z
  } else {
    out[t] += x
    out[t + 1] += y
    out[t + 2] += z
  }
}
