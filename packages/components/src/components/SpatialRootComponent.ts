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

export class SpatialTagComponent implements GameComponent {
  public entity: GameEntity
  public root: SpatialRootComponent
  public initialize(): void {
    this.root = this.entity.component(SpatialRootComponent, GetComponent.OptionalFollowParent)
  }

  public destroy(): void {
    //
  }
}

export interface SpatialRootOptions {
  instance: SpatialIndex<any>
}

export class SpatialRootComponent implements GameComponent, InitializableComponent {
  public static readonly Tag = SpatialTagComponent
  public readonly Tag: Type<SpatialTagComponent>
  public readonly entity: GameEntity
  public readonly index: SpatialIndex<any> | null

  public query: GameQuery
  protected world: GameWorld

  protected initialized = false

  public constructor(options: SpatialRootOptions) {
    this.Tag = class SpatialTag extends SpatialTagComponent {}
    this.index = options.instance
  }

  public initialize(): void {
    this.world = this.entity.world
    this.query = this.world.query({ scope: 'active', required: [this.Tag] })
    this.initialized = true
  }

  public destroy(): void {
    //
  }
}
