import { Mat4 } from '@gglib/math'
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

  private skins = new Map<number, Mat4[]>()

  public constructor(model: Model) {
    this.model = model
    this.reset()
  }

  /**
   * Decodes local transforms from all nodes and calculates the absolute node transforms
   */
  public reset() {
    this.model.getLocalPose(this.localPose)
    this.update()
  }

  /**
   * Updates the absolute transforms array from current local pose
   *
   * @remarks
   * Call this after local pose has been altered (e.g. after animation)
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
   * Updates the skin transforms by multiplying inverse bind transforms with current absolute transforms
   */
  public updateSkin(skinId: number) {
    const skin = this.model.skins[skinId]
    if (!skin) {
      return
    }
    const result = this.getJoints(skinId)
    for (let i = 0; i < skin.joints.length; i++) {
      if (skin.inverseBindMatrices[i]) {
        Mat4.multiply(skin.inverseBindMatrices[i], this.transforms[skin.joints[i]], result[i])
      } else {
        Mat4.clone(this.transforms[skin.joints[i]], result[i])
      }
    }

    return result
  }

  public getJoints(skinid: number) {
    const skin = this.model.skins[skinid]
    if (!skin) {
      return null
    }
    if (!this.skins.has(skinid)) {
      const buffer = new Float32Array(16 * skin.joints.length).buffer
      const list: Mat4[] = []
      for (let i = 0; i < skin.joints.length; i++) {
        list[i] = new Mat4(new Float32Array(buffer, i * 16 * 4, 16))
      }
      this.skins.set(skinid, list)
    }
    return this.skins.get(skinid)
  }
}
