import { type IVec3, type IVec4, Mat4 } from '@gglib/math'
import type { GameComponent } from './GameComponent'
import { GameEntity } from './GameEntity'
import { GameTypeToken } from './types'

export const GameTransformToken = new GameTypeToken<GameTransform>('GameTransform')

export interface GameTransform extends GameComponent {
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

  /**
   * Sets the parent transform of this transform
   */
  setParent(parent: GameTransform | null): void
}
