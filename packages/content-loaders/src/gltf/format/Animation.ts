import { GLTFProperty, GLTFRootProperty } from './common'

/**
 * Combines input and output accessors with an interpolation algorithm to define a keyframe graph (but not its target).
 */
export interface GLTFAnimationSampler extends GLTFProperty {

  /**
   * The index of an accessor containing keyframe input values, e.g., time.
   *
   * @remarks
   * The index of an accessor containing keyframe input values, e.g., time.
   * That accessor must have componentType `FLOAT`. The values represent time in seconds with `time[0] >= 0.0`,
   * and strictly increasing values, i.e., `time[n + 1] > time[n]`.
   */
  input: number

  /**
   * Interpolation algorithm.
   */
  interpolation?: 'LINEAR' | 'STEP' | 'CUBICSPLINE'

  /**
   * The index of an accessor, containing keyframe output values.
   *
   * @remarks
   * The index of an accessor containing keyframe output values.
   * When targeting translation or scale paths, the `accessor.componentType` of the output values must be `FLOAT`.
   * When targeting rotation or morph weights, the `accessor.componentType` of the output values must be `FLOAT` or normalized integer.
   * For weights, each output element stores `SCALAR` values with a count equal to the number of morph targets.
   */
  output: number
}

/**
 * The index of the node and TRS property that an animation channel targets.
 */
export interface GLTFAnimationChannelTarget extends GLTFProperty {
  /**
   * The index of the node to target.
   */
  node?: number

  /**
   * The name of the node's TRS property to modify, or the \"weights\" of the Morph Targets it instantiates.
   *
   * @remarks
   * For the \"translation\" property, the values that are provided by the sampler are the translation along
   * the x, y, and z axes. For the \"rotation\" property, the values are a quaternion in the order (x, y, z, w),
   * where w is the scalar. For the \"scale\" property, the values are the scaling factors along the x, y, and z axes.
   */
  path: 'translation' | 'rotation' | 'scale' | 'weights'
}

/**
 * Targets an animation's sampler at a node's property.
 */
export interface GLTFAnimationChannel extends GLTFProperty {
  /**
   * The index of a sampler in this animation used to compute the value for the target.
   *
   * @remarks
   * The index of a sampler in this animation used to compute the value for the target,
   * e.g., a node's translation, rotation, or scale (TRS).
   */
  sampler: number

  /**
   * The index of the node and TRS property to target.
   */
  target: GLTFAnimationChannelTarget
}

/**
 * A keyframe animation.
 */
export interface GLTFAnimation extends GLTFRootProperty {
  /**
   * An array of channels, each of which targets an animation's sampler at a node's property.
   * Different channels of the same animation can't have equal targets.
   */
  channels: GLTFAnimationChannel[]

  /**
   * An array of samplers that combines input and output accessors with an interpolation algorithm
   * to define a keyframe graph (but not its target).
   */
  samplers: GLTFAnimationSampler[]
}
