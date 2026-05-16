import type { GameComponent, GameEntity } from '@gglib/ecs'
import type { IVec4 } from '@gglib/math'

export type DebugShapeType = 'box' | 'sphere' | 'plane'

export interface DebugShapeOptions {
  type: DebugShapeType
  solid?: boolean
  color?: IVec4
  scale?: IVec4
}

export class DebugShapeComponent implements GameComponent {
  public entity: GameEntity
  public type: DebugShapeType = 'sphere'
  public solid: boolean = false

  public color: IVec4
  public scale: IVec4

  public constructor(options?: DebugShapeOptions) {
    this.type = options?.type ?? 'sphere'
    this.solid = options?.solid ?? false
    this.color = options?.color ?? { x: 1, y: 0, z: 0, w: 1 }
    this.scale = options?.scale ?? { x: 1, y: 1, z: 1, w: 0 }
  }

  public initialize(): void {
    //
  }

  public destroy(): void {
    //
  }
}
