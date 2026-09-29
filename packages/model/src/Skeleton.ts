import { Mat4, mat4$initFrom, mat4$multiply, mat4Identity, mat4Invert, Transform } from '@gglib/math'

const _worldInverse = mat4Identity()

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
      this.inverseBindMatrices[i] = mat4Invert(this.bones[i].world)
    }
    // this.inverseBindMatrices.map((it) => console.log(it.debug))
    this.jointMatrices = []
    this.reset()
  }

  public reset() {
    for (let i = 0; i < this.boneCount; i++) {
      this.jointMatrices[i] = mat4Invert(this.inverseBindMatrices[i])
    }
  }

  /**
   * Updates the joint matrices
   */
  public update(world: Mat4) {
    if (world) {
      mat4Invert(world, _worldInverse)
    }
    for (let i = 0; i < this.boneCount; i++) {
      const joint = this.jointMatrices[i]
      mat4$initFrom(joint, this.inverseBindMatrices[i])
      if (this.bones[i]) {
        mat4$multiply(joint, this.bones[i].world)
      }
      if (world) {
        mat4$multiply(joint, _worldInverse)
      }
    }
  }
}
