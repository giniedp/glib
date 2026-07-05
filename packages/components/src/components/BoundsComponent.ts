import { type GameComponent, GameEntity, GetComponent } from '@gglib/ecs'
import { BoundingBox, BoundingSphere } from '@gglib/math'
import { brand, EventType } from '@gglib/utils'
import { TransformComponent } from './TransformComponent'

export type Bounds = {
  box?: BoundingBox
  sphere?: BoundingSphere
}

export class BoundsComponent implements GameComponent {
  public static onDirty = brand<EventType<BoundsComponent>>(Symbol('BoundsComponent.onDirty'))
  public static onUpdated = brand<EventType<BoundsComponent>>(Symbol('BoundsComponent.onUpdated'))

  /**
   * The entity that owns this component
   */
  public readonly entity: GameEntity

  /**
   * The local bounding volumes of the entity
   */
  public readonly local: Bounds = {
    box: null,
    sphere: null,
  }

  /**
   * The world bounding volumes of the entity, updated by the BoundsUpdateSystem
   */
  public readonly world: Bounds = {
    box: null,
    sphere: null,
  }

  public version: number = 0
  public transform: TransformComponent

  public constructor(localBounds?: Bounds) {
    this.local.sphere = localBounds?.sphere ? BoundingSphere.createFrom(localBounds?.sphere) : null
    this.local.box = localBounds?.box ? BoundingBox.createFrom(localBounds?.box) : null
  }

  public initialize(): void {
    this.transform = this.entity.component(TransformComponent, GetComponent.Optional)
    this.entity.events.on(TransformComponent.onUpdated, this.emitDirtyEvent)
  }

  public activate(): void {
    this.emitDirtyEvent()
  }

  public deactivate(): void {}

  public destroy(): void {
    this.entity.events.off(TransformComponent.onUpdated, this.emitDirtyEvent)
  }

  public setLocalBounds(sphere: BoundingSphere, box: BoundingBox) {
    this.local.sphere = sphere ? BoundingSphere.createFrom(sphere) : null
    this.local.box = box ? BoundingBox.createFrom(box) : null
    this.emitDirtyEvent()
  }

  public emitDirtyEvent = () => {
    this.entity.events.emit(BoundsComponent.onDirty, this)
  }

  public updateWorldBounds(): void {
    this.version++

    const world = this.world
    const local = this.local

    let hasSphere = false
    let hasBox = false

    if (local.sphere) {
      hasSphere = true
      world.sphere ||= new BoundingSphere()
      BoundingSphere.transform(local.sphere, this.transform.world, world.sphere)
    }

    if (local.box) {
      hasBox = true
      world.box ||= new BoundingBox()
      BoundingBox.transform(local.box, this.transform.world, world.box)
    }

    if (!hasSphere && !hasBox) {
      world.sphere = null
      world.box = null
    } else if (!hasSphere) {
      world.sphere ||= new BoundingSphere()
      world.sphere.initFromBox(world.box)
    } else if (!hasBox) {
      world.box ||= new BoundingBox()
      world.box.initFromSphere(world.sphere)
    }

    this.entity.events.emit(BoundsComponent.onUpdated, this)
  }
}
