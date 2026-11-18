import type { AnimationPose } from './AnimationPose'
import type { JointMask } from './PoseBlender'
import {
  AnimationClipCursor,
  clipBindingMask,
  sampleClip,
  type AnimationClipBinding,
  type AnimationTrackClip,
} from './AnimationTrackClip'

/**
 * What an {@link AnimationMixer} entry plays: a clip, or anything that produces a pose over a normalized time
 * (e.g. a blend space of several clips)
 *
 * @public
 */
export interface AnimationSource<S = unknown> {
  /**
   * Seconds for the normalized time to go from 0 to 1 at speed 1
   */
  readonly duration: number
  /**
   * The source produces deltas (an additive layer composes them onto the layers below)
   */
  readonly additive: boolean
  /**
   * The joints the source animates, all when not given. On layers above 0 the other joints keep the pose of the layers
   * below (CryAnimation applies only the controllers a clip has); layer 0 samples over the whole default pose.
   */
  readonly mask?: JointMask
  /**
   * Creates the playback state of one entry, e.g. a cursor. Called once when the entry starts.
   */
  createState(): S
  /**
   * Writes the pose at the normalized time into `out`. `out` holds the rig's default pose, or the identity when
   * `delta` is set (additive layers).
   */
  sample(time: number, out: AnimationPose, state: S, delta: boolean): void
  /**
   * How far the normalized time moves in `dt` seconds at speed 1. Defaults to `dt / duration`.
   */
  step?(time: number, dt: number, state: S): number
}

/**
 * A clip as a source of an {@link AnimationMixer}
 *
 * @public
 *
 * @example
 * ```ts
 * mixer.play(clipSource(rig.bind(clip)), { loop: true, fade: 0.2 })
 * ```
 */
export function clipSource(binding: AnimationClipBinding): AnimationSource<AnimationClipCursor> {
  const clip: AnimationTrackClip = binding.clip
  return {
    duration: clip.duration,
    additive: clip.additive,
    mask: clipBindingMask(binding),
    createState: () => new AnimationClipCursor(clip),
    sample: (time, out, cursor, delta) => sampleClip(binding, cursor, clip.timeAt(time), out, delta),
  }
}
