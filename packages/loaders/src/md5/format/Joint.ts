import { Vec3 } from './Vec3'
import { Vec4 } from './Vec4'

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
  position: Vec3
  /**
   * Rotation of this bone
   */
  rotation: Vec4
}
