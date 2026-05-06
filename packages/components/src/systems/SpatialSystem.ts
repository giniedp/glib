import { GameEntity, GameQuery, GameSystem, GameWorld, GetComponent } from '@gglib/ecs'
import { SpatialComponent } from '../components/SpatialComponent'
import { SpatialRootComponent } from '../components/SpatialRootComponent'
import { addSpatialEntry, QuadTree, removeSpatialEntry } from '../spatial'

export class SpatialSystem extends GameSystem {
  protected world: GameWorld
  protected query: GameQuery

  public constructor(world: GameWorld) {
    super()
    this.world = world
  }

  public override initialize(): void {
    this.query = this.world.query({ required: [SpatialRootComponent.Tag] })
    this.world.onEntityActivating.add(this.addSpatialTag)
    this.world.onEntityDeactivated.add(this.removeSpatialTag)
  }

  public override destroy(): void {
    this.world.onEntityActivating.remove(this.addSpatialTag)
    this.world.onEntityDeactivated.remove(this.removeSpatialTag)
  }

  private addSpatialTag = (entity: GameEntity) => {
    if (!entity.has(SpatialComponent)) {
      return
    }
    const root = entity.component(SpatialRootComponent, GetComponent.OptionalFollowParent)
    if (root && !entity.has(root.Tag)) {
      // prettier-ignore
      entity.addComponent(
        new root.Tag(),           // instance
        root.Tag,                 // instance type
        SpatialRootComponent.Tag, // alias type, so it can be found without knowing the instance type
      )
    }
  }

  private removeSpatialTag = (entity: GameEntity) => {
    const component = entity.component(SpatialRootComponent.Tag, GetComponent.Optional)
    if (component) {
      entity.removeComponentByType(SpatialRootComponent.Tag)
    }
  }

  public override update(): void {
    this.query.forEach(updateSpatialIndex)
  }
}

function updateSpatialIndex(entity: GameEntity) {
  const index = entity.component(SpatialRootComponent.Tag).root.index
  const component = entity.component(SpatialComponent)

  if (component.version === component.bounds.version) {
    // bounds unchanged, skip update
    return
  }

  const entry = component.entry
  entry.bounds = component.bounds.world.box
  component.version = component.bounds.version

  if (!entry.bounds) {
    // vanished bounds, remove from spatial index
    if (entry.node) {
      removeSpatialEntry(entry.node, entry)
    }
    entry.node = null
    return
  }

  const node = index.findFittingNode(entry.bounds)
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
}
