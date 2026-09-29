import { IVec3, IVec4 } from '@gglib/math'

export interface Joint {
  /**
   * The name of this bone
   */
  name: string
  /**
   * The index of the parent bone
   */
  parentIndex: number
  /**
   * Position of this bone
   */
  position: IVec3
  /**
   * Rotation of this bone
   */
  rotation: IVec4
}
