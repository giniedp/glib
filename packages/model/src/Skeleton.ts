import { Mat4, Transform } from '@gglib/math'

const _worldInverse = Mat4.createIdentity()

export interface SkeletonOptions {
  /**
   * The bone transforms of this skeleton.
   *
   * @remarks
   * The transforms are part of the model or scene graph and are updated
   * from the outside, e.g. by the animation player.
   */
  bones: Transform[]

  /**
   * The skin inverse bind matrices.
   */
  inverseBindMatrices: Mat4[]
}

export class Skeleton {
  /**
   * Bone transforms of this skeletn
   *
   * @remarks
   * The transforms are part of the model or scene graph and are updated
   * from the outside, e.g. by the animation player.
   */
  public readonly bones: ReadonlyArray<Readonly<Transform>>

  /**
   * The skin inverse bind matrices.
   *
   * @remarks
   *
   */
  public inverseBindMatrices: Mat4[]

  /**
   *
   */
  public jointMatrices: Mat4[]

  public get boneCount() {
    return this.bones.length
  }

  public constructor(bones: Transform[], inverseMatrices: Mat4[]) {
    this.bones = bones
    this.inverseBindMatrices = inverseMatrices
    if (inverseMatrices.length !== bones.length) {
      throw new Error(
        `Expected inverse matrices length to match bones length, got ${inverseMatrices.length} vs ${bones.length}`,
      )
    }
    // this.inverseBindMatrices.map((it) => console.log(it.debug))

    for (let i = 0; i < this.boneCount; i++) {
      this.inverseBindMatrices[i] = this.bones[i].world.copy().invert()
    }
    // this.inverseBindMatrices.map((it) => console.log(it.debug))
    this.jointMatrices = []
    this.reset()
  }

  public reset() {
    for (let i = 0; i < this.boneCount; i++) {
      this.jointMatrices[i] = this.inverseBindMatrices[i].copy().invert()
    }
  }

  /**
   * Updates the joint matrices
   */
  public update(world: Mat4) {
    if (world) {
      Mat4.invert(world, _worldInverse)
    }
    for (let i = 0; i < this.boneCount; i++) {
      const joint = this.jointMatrices[i]
      joint.initFrom(this.inverseBindMatrices[i])
      if (this.bones[i]) {
        joint.multiply(this.bones[i].world)
      }
      if (world) {
        joint.multiply(_worldInverse)
      }
    }
  }
}
