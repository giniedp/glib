import { IVec3, IVec4, Mat4} from '@gglib/math'
import { GameEntity } from './GameEntity'

export interface GameTransform {
  /**
   * The scale of the transform in local space
   */
  readonly scale: IVec3

  /**
   * The position of the transform in local space
   */
  readonly translation: IVec3

  /**
   * The rotation of the transform in local space
   */
  readonly rotation: IVec4

  /**
   * The local transform matrix
   */
  readonly matrix: Mat4

  /**
   * The world transform matrix
   */
  readonly world: Mat4

  /**
   * Indicates that a state has changed and the transform needs to be updated
   */
  needsUpdate: boolean

  /**
   * The entity of this transform
   */
  readonly entity: GameEntity

  /**
   * The parent transform of this transform
   */
  readonly parent: GameTransform | null

  /**
   * The child transforms
   */
  readonly children: GameTransform[]
}
