import { IVec3, IVec4 } from '@gglib/math'

export interface AnimationData {
  /**
   * The name of this animation clip
   */
  name: string
  /**
   * Duration of an animation clip in seconds
   */
  duration: number
  /**
   * Type of this animation data
   */
  type: 'channels' | 'keyframes'
  /**
   * Collection of animation channels
   */
  channels?: AnimationDataChannels[]
  /**
   * Collection of animation keyframes
   */
  keyframes?: AnimationDataFrame
}

export interface AnimationDataChannels {
  /**
   * The object id to animate with this track (node or bone id)
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

export interface AnimationDataChannel<T extends IVec3 | IVec4> {
  /**
   * Interpolation method to use when blending frames
   */
  interpolation: 'step' | 'linear' | 'cubic'
  /**
   * Animation samples
   */
  samples: AnimationDataChannelSample<T>[]
}

export interface AnimationDataChannelSample<T extends IVec3 | IVec4> {
  /**
   * Time at which to apply the transforms
   */
  time: number
  /**
   * The frame value
   */
  value: T
  /**
   * Input tangent value for cubic spline interpolation
   */
  ti?: T
  /**
   * Output tangent value for cubic spline interpolation
   */
  to?: T
}

export interface AnimationDataFrame {
  /**
   * Time at which to apply the transforms
   */
  time?: number
  /**
   * The animation frames
   */
  samples: AnimationDataSample[]
}
export interface AnimationDataSample extends AnimationTargetPose {
  /**
   * The object id to animate with this track (node or bone id)
   */
  target: number
}

export interface AnimationTargetPose {
  /**
   * Translation part
   */
  translation?: IVec3
  /**
   * Rotation part
   */
  rotation?:  IVec4
  /**
   * Scale part
   */
  scale?: IVec3
}
