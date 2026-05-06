import { GameComponent, GameEntity } from '@gglib/ecs'
import { removeSpatialEntry, SpatialEntry } from '../spatial'
import { BoundsComponent } from './BoundsComponent'

export class SpatialComponent implements GameComponent {
  public readonly entity: GameEntity

  public readonly entry: SpatialEntry = {
    node: null,
    entity: null,
    bounds: null,
  }

  public bounds: BoundsComponent
  public version: number = null

  public initialize?(): void {
    this.bounds = this.entity.component(BoundsComponent)
    this.entry.entity = this.entity
  }

  public activate(): void {
    //
  }

  public deactivate?(): void {
    //
  }

  public destroy?(): void {
    if (this.entry.node) {
      removeSpatialEntry(this.entry.node, this.entry)
    }
  }
}
