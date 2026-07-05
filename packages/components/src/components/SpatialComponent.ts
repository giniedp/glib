import { GameComponent, GameEntity, GetComponent } from '@gglib/ecs'
import { brand, EventType } from '@gglib/utils'
import { addSpatialEntry, removeSpatialEntry, SpatialEntry } from '../spatial'
import { BoundsComponent } from './BoundsComponent'
import { SpatialRootComponent } from './SpatialRootComponent'

export class SpatialComponent implements GameComponent {
  public static readonly onDirty = brand<EventType<SpatialComponent>>(Symbol('SpatialComponent.onDirty'))
  public static readonly onUpdated = brand<EventType<SpatialComponent>>(Symbol('SpatialComponent.onUpdated'))

  public readonly entity: GameEntity

  public readonly entry: SpatialEntry = {
    node: null,
    entity: null,
    box: null,
    sphere: null,
  }

  public root: SpatialRootComponent
  public bounds: BoundsComponent
  public version: number = null

  private isActive = false
  public initialize(): void {
    this.root = this.entity.component(SpatialRootComponent, GetComponent.OptionalFollowParent)
    this.bounds = this.entity.component(BoundsComponent)
    this.bounds.entity.events.on(BoundsComponent.onUpdated, this.emitDirtyEvent)
    this.entry.entity = this.entity
  }

  public activate(): void {
    this.isActive = true
    this.emitDirtyEvent()
  }

  public deactivate(): void {
    this.isActive = false
    this.emitDirtyEvent()
  }

  public destroy?(): void {
    this.bounds.entity.events.off(BoundsComponent.onUpdated, this.emitDirtyEvent)
    if (this.entry.node) {
      removeSpatialEntry(this.entry.node, this.entry)
      this.entry.node = null
    }
  }

  public emitDirtyEvent = () => {
    this.entity.events.emit(SpatialComponent.onDirty, this)
  }

  public updateFitting() {
    if (!this.isActive && this.entry.node) {
      removeSpatialEntry(this.entry.node, this.entry)
      this.entry.node = null
      return
    }
    if (!this.root) {
      console.warn('SpatialComponent has no root, cannot update fitting')
      return
    }
    const index = this.root.index
    const entry = this.entry
    entry.box = this.bounds.world.box
    entry.sphere = this.bounds.world.sphere
    this.version = this.bounds.version

    if (!entry.box) {
      // vanished bounds, remove from spatial index
      if (entry.node) {
        removeSpatialEntry(entry.node, entry)
      }
      entry.node = null
      return
    }

    const node = index.findFittingNode(entry.box)
    if (entry.node === node) {
      // unchanged fit
      return
    }

    // remove from old, insert into new node
    if (entry.node) {
      removeSpatialEntry(entry.node, entry)
    }

    addSpatialEntry(node, entry)
    entry.node = node

    this.entity.events.emit(SpatialComponent.onUpdated, this)
  }
}
