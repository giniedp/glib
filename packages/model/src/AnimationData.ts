import type { IVec3, IVec4 } from '@gglib/math'

/**
 * @public
 */
export interface AnimationData {
  /**
   * The name of this animation clip
   */
  name: string

  /**
   * Collection of animation channels, at most one entry per target
   */
  channels: AnimationDataChannels[]
}

/**
 * @public
 */
export interface AnimationDataChannels {
  /**
   * Object id to animate with this track (node or bone id)
   */
  target: number
  /**
   * Position channel data
   */
  translation?: AnimationDataChannel<IVec3>
  /**
   * Rotation channel data
   */
  rotation?: AnimationDataChannel<IVec4>
  /**
   * Scale channel data
   */
  scale?: AnimationDataChannel<IVec3>
}

/**
 * Interpolation between key frames, as defined by glTF
 *
 * @public
 *
 * @remarks
 * - `STEP` keeps the value of a key frame until the next one
 * - `LINEAR` interpolates linearly, rotations are interpolated spherically
 * - `CUBICSPLINE` cubic hermite spline, key frames have in and out tangents
 */
export type AnimationInterpolation = 'STEP' | 'LINEAR' | 'CUBICSPLINE'

/**
 * @public
 */
export interface AnimationDataChannel<T extends IVec3 | IVec4> {
  /**
   * Interpolation method to use to blend frames
   */
  interpolation: AnimationInterpolation
  /**
   * Animation samples, ordered by time
   */
  samples: AnimationDataChannelSample<T>[]
}

/**
 * @public
 */
export interface AnimationDataChannelSample<T extends IVec3 | IVec4> {
  /**
   * Time in seconds at which to apply the transforms
   */
  time: number
  /**
   * The frame value
   */
  value: T
  /**
   * In tangent for `CUBICSPLINE` interpolation
   */
  inTangent?: T
  /**
   * Out tangent for `CUBICSPLINE` interpolation
   */
  outTangent?: T
}
