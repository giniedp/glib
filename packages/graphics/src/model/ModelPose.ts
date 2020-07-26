import type { Mat4 } from '@gglib/math'
import type { Model } from './Model'
import type { ModelNodePose } from './ModelNode'
import type { AnimationPlayer } from '../AnimationPlayer'

export class ModelPose {

  /**
   * The model this pose belongs to
   */
  public readonly model: Model

  /**
   * Array of absolute transforms for each node in model
   */
  public readonly transforms: Mat4[] = []

  /**
   * Array of local transform attributes for each node in model
   */
  public readonly localPose: ModelNodePose[] = []

  public constructor(model: Model) {
    this.model = model
    this.reset()
  }

  /**
   * Reads the local transforms from the nodes data and then updates the absolute transforms array
   */
  public reset() {
    this.model.getLocalPose(this.localPose)
    this.update()
  }

  /**
   * Updates the absolute transforms array from current local pose
   */
  public update() {
    this.model.getAbsoluteTransforms(this.transforms, this.localPose)
  }

  /**
   * Samples the animation player with given time and updates the local pose, then updates the absolute transforms
   *
   * @param time - the animation time
   * @param animation - the animation player
   */
  public updateFromAnimation(time: number, animation: AnimationPlayer) {
    if (animation.sample(time, this.localPose)) {
      this.model.getAbsoluteTransforms(this.transforms, this.localPose)
    }
  }

  /**
   * Gets the absolute transform for given node index
   *
   * @param nodeIndex
   */
  public getTransform(nodeIndex: number): Mat4 {
    return this.transforms[nodeIndex]
  }

}
