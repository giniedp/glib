import { Entity, Inject, Listener, OnRemoved, OnUpdate, Component } from '@gglib/ecs'
import { BoundingBox, BoundingSphere, BoundingVolume, Mat4, Vec3 } from '@gglib/math'
import { SpatialSystemComponent } from './SpatialSystemComponent'
import { TransformComponent } from './TransformComponent'

/**
 * The BoundingVolumeComponent adds bounding capability to an entity
 *
 * @public
 * @remarks
 * ## What it does
 * Holds a reference to an untransformed bounding volume and transforms that
 * into world space when the transform or volume have changed.
 * Re-inserts itself in the spatial system each time the volume has been updated.
 *
 * ## Required Services
 * - `TransformComponent` in order to update the volume into world space
 * - `SpatialSystemComponent` which is resolved from `root` entity
 */
@Component({
  install: [TransformComponent],
})
export class BoundingVolumeComponent implements OnUpdate, OnRemoved {

  /**
   * The name of this component (`BoundingVolume`)
   */
  public readonly name = 'BoundingVolume'

  /**
   * The transform of the entity. Used to transform the linked volume from local space to world space.
   */
  @Inject(TransformComponent)
  public readonly transform: TransformComponent

  /**
   * The spatial system where this volume will be inserted for intersection and visibility tests.
   */
  @Inject(SpatialSystemComponent, { from: 'root', optional: true })
  public readonly spatial: SpatialSystemComponent

  /**
   * The entity that owns this component
   */
  @Inject(Entity)
  public readonly entity: Entity

  /**
   * The volume in world space
   */
  public readonly volume: BoundingVolume & { update: (m: Mat4) => void }

  protected transformChanged = true
  protected volumeChanged = true
  protected isAdded = false
  protected linkedVolume: BoundingVolume

  /**
   * Component life cycle method
   *
   * @remarks
   * Transforms the volume into world space if needed and updates
   * its placement in the spatial system.
   */
  public onUpdate() {
    if ((this.volumeChanged || this.transformChanged) && this.transform) {
      if (this.volume) {
        this.volumeChanged = false
        this.transformChanged = false
        this.volume.update(this.transform.world)
        if (this.spatial) {
          this.spatial.insert(this.entity, this.volume)
          this.isAdded = true
        }
      } else if (this.isAdded && this.spatial) {
        this.spatial.remove(this.entity)
        this.isAdded = false
      }
    }
  }

  /**
   * Component life cycle method
   */
  public onRemoved() {
    this.spatial.remove(this.entity)
  }

  @Listener(TransformComponent.ON_UPDATED)
  public onTransformUpdated() {
    this.transformChanged = true
  }

  /**
   * Links a bounding volume in object space to this component
   *
   * @param volume - the bounding volume in local space
   * @remarks
   * The volume will be used as reference to generate a bounding volume in
   * world space. When the transform component changes the bounding volume
   * will be re
   */
  public linkVolume(volume: BoundingVolume) {
    this.linkedVolume = volume

    if (volume instanceof BoundingSphere) {
      (this as { volume: BoundingVolume }).volume = new UpdatableBoundingSphere(volume)
    } else if (volume instanceof BoundingBox) {
      (this as { volume: BoundingVolume }).volume = new UpdatableBoundingBox(volume)
    } else if (volume) {
      throw new Error(`Unsupported volume type: ${typeof volume}`)
    }

    this.volumeChanged = true
  }
}

class UpdatableBoundingSphere extends BoundingSphere {
  constructor(public original: BoundingSphere) {
    super()
  }

  public update(transform: Mat4) {
    // use center vector as temporary variable
    this.center.init(this.original.radius, this.original.radius, this.original.radius)
    this.radius = transform.transformV3Normal(this.center).length()
    transform.transformV3(this.original.center, this.center)
  }
}

class UpdatableBoundingBox extends BoundingBox {
  private temp = Vec3.init({}, 0, 0, 0)
  constructor(public original: BoundingBox) {
    super()
  }

  public update(transform: Mat4) {
    const t = this.temp

    transform.transformV3(this.original.getCorner(0, t))
    this.init(t.x, t.y, t.z, t.x, t.y, t.z)

    this.mergePoint(transform.transformV3(this.original.getCorner(1, t)))
    this.mergePoint(transform.transformV3(this.original.getCorner(2, t)))
    this.mergePoint(transform.transformV3(this.original.getCorner(3, t)))
    this.mergePoint(transform.transformV3(this.original.getCorner(4, t)))
    this.mergePoint(transform.transformV3(this.original.getCorner(5, t)))
    this.mergePoint(transform.transformV3(this.original.getCorner(6, t)))
    this.mergePoint(transform.transformV3(this.original.getCorner(7, t)))
  }
}
