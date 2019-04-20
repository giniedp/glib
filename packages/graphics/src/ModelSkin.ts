import { IVec3, IVec4, Mat4Data } from '@gglib/math'

export interface ModelJointPose {
  /**
   * The scale of this joint
   */
  scale: IVec3
  /**
   * The rotation of this joint
   */
  rotation: IVec4
  /**
   * The translation of this joint
   */
  translation: IVec3
}

export interface ModelJoint {
  /**
   * The name of this joint
   */
  name: string
  /**
   * The index of the parent joint in collection
   */
  parent: number
}

export interface ModelSkin {
  /**
   * The skeleton Hierarchy
   *
   * @remarks
   * The skeleton hierarchy stores for each joint the index of its parent joint.
   */
  hierarchy: ModelJoint[]
  /**
   * The bind pose
   *
   * @remarks
   * The bind pose transforms for each joint
   */
  bindPose: ModelJointPose[]
  /**
   * The inverse bind pose
   *
   * @remarks
   * The inverse bind pose transforms for each joint.
   * If it is not set it is assumed to be the identity matrix for each joint
   * meaning that the inverse was preapplied
   */
  inverseBindPose?: Mat4Data[]
}
