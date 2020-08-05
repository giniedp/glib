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
   * Final global transforms (with animation applied) for each node in model
   */
  public readonly transforms: Mat4[]

  /**
   * Array of local transform attributes for each node in model
   */
  public readonly localPose: ModelNodePose[] = []

  private skins = new Map<number, Mat4[]>()

  public constructor(model: Model) {
    this.model = model
    this.transforms = Mat4.alloc(model.hierarchy.nodes.length)
    this.model.hierarchy.walk((node) => {
      const skin = model.skins[node.skin]
      if (skin) {
        this.skins.set(node.skin, Mat4.alloc(skin.joints.length))
      }
    })
    this.reset()
  }

  /**
   * Decodes local transforms from all nodes and calculates the absolute node transforms
   */
  public reset() {
    this.model.hierarchy.calculateLocalPose(this.localPose)
    this.model.hierarchy.calculateGlobalTransforms(this.transforms)
  }

  /**
   * Updates the absolute transforms array from current local pose
   *
   * @remarks
   * Call this after local pose has been altered (e.g. after animation)
   */
  public update() {
    this.model.hierarchy.updateGlobalTransforms(this.localPose, this.transforms)
  }

  /**
   * Samples the animation player with given time and updates the local pose, then updates the absolute transforms
   *
   * @param time - the animation time
   * @param animation - the animation player
   */
  public updateFromAnimation(time: number, animation: AnimationPlayer) {
    if (animation.sample(time, this.localPose)) {
      this.model.hierarchy.updateGlobalTransforms(this.localPose, this.transforms)
    }
  }

  /**
   * Updates the skin transforms by multiplying inverse bind transforms with current absolute transforms
   */
  public updateSkin(skinId: number, nodeId: number) {
    const skin = this.model.skins[skinId]
    if (!skin) {
      return
    }
    const result = this.getJoints(skinId)
    const globalInverse = this.model.hierarchy.globalInverseTransforms
    for (let i = 0; i < skin.joints.length; i++) {
      if (skin.inverseBindMatrices[i]) {
        Mat4.multiply(this.transforms[skin.joints[i]], skin.inverseBindMatrices[i], result[i])
        Mat4.multiply(globalInverse[nodeId], result[i], result[i])
      } else {
        Mat4.clone(this.transforms[skin.joints[i]], result[i])
      }
    }

    return result
  }

  public getJoints(skinid: number) {
    return this.skins.get(skinid)
  }
}
