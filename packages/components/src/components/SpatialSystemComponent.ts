import { BoundingBox, BoundingFrustum, BoundingSphere, BoundingVolume, IVec3, IVec4, Ray, Vec3 } from '@gglib/math'
import { QuadTree } from './spatial'
import { SpatialEntry, SpatialSystem } from './SpatialSystem'
import { GameEntity, GameSystem, GameProvider } from '@gglib/ecs'

/**
 * @public
 */
export interface SpatialSystemComponentOptions {
  system?: SpatialSystem<GameEntity>
}

/**
 * @public
 */
export class SpatialSystemComponent implements GameSystem {

  /**
   * The underlying spatial system implementation
   */
  public readonly system: SpatialSystem<GameEntity>

  private lookup = new Map<GameEntity, SpatialEntry<GameEntity>>()

  public constructor(options: SpatialSystemComponentOptions = {}) {
    this.system = options?.system ?? QuadTree.create(Vec3.create(-512, -512, -512), Vec3.create(512, 512, 512), 6)
  }

  public initialize(container: GameProvider): void {
    //
  }

  public destroy(): void {
    //
  }

  /**
   * Inserts an entity into the spatial system
   *
   * @param entity - the entity to insert
   * @param volume - the volume of the entity
   * @remarks
   * If the entity is already inserted in the system its placement
   * will be re-evaluated and updated if needed
   */
  public insert(entity: GameEntity, volume: BoundingVolume): void {
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
  public remove(entity: GameEntity): void {
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

  public testRay(ray: Ray, out: GameEntity[]): boolean {
    return this.system.testRay(ray, out)
  }

  public testPoint(point: IVec3, out: GameEntity[]): boolean {
    return this.system.testPoint(point, out)
  }

  public testPlane(plane: IVec4, out: GameEntity[]): boolean {
    return this.system.testPlane(plane, out)
  }

  public testBox(volume: BoundingBox, out: GameEntity[]): boolean {
    return this.system.testBox(volume, out)
  }

  public testSphere(volume: BoundingSphere, out: GameEntity[]): boolean {
    return this.system.testSphere(volume, out)
  }

  public testFrustum(volume: BoundingFrustum, out: GameEntity[]): boolean {
    return this.system.testFrustum(volume, out)
  }
}
