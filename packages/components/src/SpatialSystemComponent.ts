import { Entity, Service } from '@gglib/ecs'
import {
  BoundingBox,
  BoundingFrustum,
  BoundingSphere,
  IVec3,
  IVec4,
  Ray,
  Vec3,
} from '@gglib/math'
import { getOption } from '@gglib/utils'
import { BoundingVolumeComponent } from './BoundingVolumeComponent'
import { QuadTree } from './spatial'
import { SpatialEntry, SpatialSystem } from './SpatialSystem'

/**
 * @public
 */
export interface SpatialSystemComponentOptions {
  system?: SpatialSystem<Entity>
}

/**
 * @public
 */
@Service()
export class SpatialSystemComponent {
  /**
   * The component name (`SpatialSystem`)
   */
  public readonly name: string = 'SpatialSystem'

  /**
   * The underlying spatial system implementation
   */
  public readonly system: SpatialSystem<Entity>

  private lookup = new Map<Entity, SpatialEntry<Entity>>()

  public constructor(options: SpatialSystemComponentOptions = {}) {
    this.system = getOption(
      options,
      'system',
      QuadTree.create(
        Vec3.create(-512, -512, -512),
        Vec3.create(512, 512, 512),
        6,
      ),
    )
  }

  /**
   * Inserts an entity into the spatial system
   *
   * @param entity - the entity to insert
   * @remarks
   * If the entity is already inserted in the system its placement
   * will be re-evaluated and updated if needed
   */
  public insert(entity: Entity): void {
    const volume = entity.getService(BoundingVolumeComponent).volume
    const node = this.system.fit(volume)

    let entry = this.lookup.get(entity)
    if (entry && entry.node === node) {
      return
    }

    if (entry) {
      entry.node.remove(entry)
    } else {
      entry = { element: entity, volume: volume, node: node }
    }
    this.lookup.set(entity, entry)
    node.insert(entry)
  }

  /**
   * Removes the entiry from the spatial system
   *
   * @param entity - the entity to remove
   */
  public remove(entity: Entity): void {
    const entry = this.lookup.get(entity)
    if (entry) {
      entry.node.remove(entry)
      this.lookup.delete(entity)
    }
  }

  /**
   * Removes all entities from the system
   */
  public clear(): void {
    this.lookup.forEach((entry) => entry.node.remove(entry))
    this.lookup.clear()
  }

  public testRay(ray: Ray, out: Entity[]): boolean {
    return this.system.testRay(ray, out)
  }

  public testPoint(point: IVec3, out: Entity[]): boolean {
    return this.system.testPoint(point, out)
  }

  public testPlane(plane: IVec4, out: Entity[]): boolean {
    return this.system.testPlane(plane, out)
  }

  public testBox(volume: BoundingBox, out: Entity[]): boolean {
    return this.system.testBox(volume, out)
  }

  public testSphere(volume: BoundingSphere, out: Entity[]): boolean {
    return this.system.testSphere(volume, out)
  }

  public testFrustum(volume: BoundingFrustum, out: Entity[]): boolean {
    return this.system.testFrustum(volume, out)
  }
}
