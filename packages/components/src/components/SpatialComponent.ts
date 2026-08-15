import {
  type GameComponent,
  GameEntity,
  GameQuery,
  GameWorld,
  GetComponent,
  InitializableComponent,
  Type,
} from '@gglib/ecs'
import { SpatialIndex } from '../spatial'

export class SpatialMemberComponent implements GameComponent {
  public entity: GameEntity
  public root: SpatialComponent
  public initialize(): void {
    this.root = this.entity.component(SpatialComponent, GetComponent.OptionalFollowParent)
  }

  public destroy(): void {
    //
  }
}

export interface SpatialComponentOptions {
  index: SpatialIndex<any>
}

export class SpatialComponent implements GameComponent, InitializableComponent {
  public static readonly Member = SpatialMemberComponent
  public readonly Member: Type<SpatialMemberComponent>
  public readonly entity: GameEntity
  public readonly index: SpatialIndex<any>

  public query: GameQuery
  protected world: GameWorld

  public constructor(options: SpatialComponentOptions) {
    this.Member = class SpatialMember extends SpatialMemberComponent {}
    this.index = options.index
  }

  public initialize(): void {
    this.world = this.entity.world
    this.query = this.world.query({ scope: 'active', required: [this.Member] })
  }

  public destroy(): void {
    //
  }
}
