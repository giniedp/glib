import { type GameComponent, GameEntity, InitializableComponent } from '@gglib/ecs'
import {
  BoundingBox,
  BoundingCylinder,
  BoundingOrientedBox,
  BoundingSphere,
  gjkIntersects,
  IRay,
  IVec3,
  rayIntersectsSphereAt,
  vec3,
} from '@gglib/math'
import { brand, EventType } from '@gglib/utils'
import type { TransformComponent } from './TransformComponent'

/**
 * The shape of a {@link ColliderComponent} in local space of its entity
 *
 * @public
 * @remarks
 * - `sphere`: the radius is scaled by the largest axis scale of the entity
 * - `box`: follows rotation and scale of the entity
 * - `cylinder`: the axis is the local y axis. The height is scaled along y, the radius by the larger of the x and z scale
 */
export type ColliderShape =
  | { type: 'sphere'; radius: number; center?: IVec3 }
  | { type: 'box'; size: IVec3; center?: IVec3 }
  | { type: 'cylinder'; radius: number; height: number; center?: IVec3 }

/**
 * The world space volume of a {@link ColliderComponent}
 *
 * @public
 */
export type ColliderVolume = BoundingSphere | BoundingOrientedBox | BoundingCylinder

/**
 * Payload of the collision events
 *
 * @public
 * @remarks
 * The event objects are reused by the {@link CollisionSystem}, don't keep a reference after the handler returns.
 */
export interface CollisionEvent {
  /**
   * The collider of the entity that receives the event
   */
  self: ColliderComponent
  /**
   * The collider of the other entity
   */
  other: ColliderComponent
}

/**
 * Constructor options for {@link ColliderComponent}
 *
 * @public
 */
export interface ColliderComponentOptions {
  /**
   * The shape in local space of the entity
   */
  shape: ColliderShape
  /**
   * Bits of the layers this collider belongs to. Defaults to `1`
   */
  layer?: number
  /**
   * Bits of the layers this collider collides with. Defaults to all layers
   */
  mask?: number
  /**
   * Disabled colliders are ignored. Defaults to `true`
   */
  enabled?: boolean
  /**
   * Emits {@link ColliderComponent.onCollisionStay} every frame while overlapping. Defaults to `false`
   */
  emitStay?: boolean
}

const center = vec3()
const localBox = new BoundingBox()
const localSphere = new BoundingSphere()

/**
 * Gives an entity a shape that is checked for collisions by the {@link CollisionSystem}
 *
 * @public
 * @remarks
 * Collisions are only detected, never resolved. The system reports which colliders overlap
 * and what a ray hits, moving the entities apart is up to the game logic.
 *
 * Two colliders `a` and `b` are checked if `a.layer & b.mask` and `b.layer & a.mask` are both non zero.
 * The entity hierarchy is ignored, parent and child colliders collide like any other.
 *
 * The events are emitted on the entity event emitter, which is also routed to the world event bus.
 *
 * @example
 * ```ts
 * entity.events.on(ColliderComponent.onCollisionEnter, ({ self, other }) => { ... })
 * world.eventBus.on(ColliderComponent.onCollisionEnter, ({ self, other }) => { ... })
 * ```
 */
export class ColliderComponent implements GameComponent, InitializableComponent {
  /**
   * Emitted when two colliders start to overlap
   */
  public static readonly onCollisionEnter = brand<EventType<CollisionEvent>>(Symbol('onCollisionEnter'))
  /**
   * Emitted every frame while two colliders overlap, only to colliders with {@link ColliderComponent.emitStay}
   */
  public static readonly onCollisionStay = brand<EventType<CollisionEvent>>(Symbol('onCollisionStay'))
  /**
   * Emitted when two colliders stop to overlap, or one of them is disabled, deactivated or destroyed
   */
  public static readonly onCollisionExit = brand<EventType<CollisionEvent>>(Symbol('onCollisionExit'))

  /**
   * The entity that owns this component
   */
  public readonly entity: GameEntity

  /**
   * The shape in local space of the entity
   */
  public shape: ColliderShape

  /**
   * Bits of the layers this collider belongs to
   */
  public layer: number = 1

  /**
   * Bits of the layers this collider collides with
   */
  public mask: number = 0xffffffff

  /**
   * Disabled colliders are ignored
   */
  public enabled: boolean = true

  /**
   * Emits {@link ColliderComponent.onCollisionStay} every frame while overlapping
   */
  public emitStay: boolean = false

  /**
   * Whether the collider overlaps any other collider. Updated by the {@link CollisionSystem}
   */
  public colliding: boolean = false

  /**
   * The world space axis aligned box that encloses the shape. Updated by {@link updateVolume}
   */
  public readonly worldBox = new BoundingBox()

  /**
   * The world space volume of the shape. Updated by {@link updateVolume}
   */
  public get volume(): ColliderVolume {
    return this.current
  }

  private transform: TransformComponent
  private sphere = new BoundingSphere()
  private box = new BoundingOrientedBox()
  private cylinder = new BoundingCylinder()
  private current: ColliderVolume = this.sphere

  public constructor(options: ColliderComponentOptions) {
    this.shape = options.shape
    this.layer = options.layer ?? this.layer
    this.mask = options.mask ?? this.mask
    this.enabled = options.enabled ?? this.enabled
    this.emitStay = options.emitStay ?? this.emitStay
  }

  public initialize(): void {
    this.transform = this.entity.getTransform<TransformComponent>()
    if (!this.transform) {
      throw new Error('ColliderComponent requires a transform component')
    }
  }

  public destroy(): void {
    //
  }

  /**
   * Updates the world volume from the shape and the entity transform
   */
  public updateVolume(): void {
    this.transform.propagateUpdates(true, false)
    const world = this.transform.world
    const shape = this.shape
    center.x = shape.center?.x ?? 0
    center.y = shape.center?.y ?? 0
    center.z = shape.center?.z ?? 0

    switch (shape.type) {
      case 'sphere': {
        localSphere.initFromCenterRadius(center, shape.radius)
        this.current = BoundingSphere.transform(localSphere, world, this.sphere)
        this.worldBox.initFromSphere(this.sphere)
        break
      }
      case 'box': {
        localBox.min.x = center.x - shape.size.x / 2
        localBox.min.y = center.y - shape.size.y / 2
        localBox.min.z = center.z - shape.size.z / 2
        localBox.max.x = center.x + shape.size.x / 2
        localBox.max.y = center.y + shape.size.y / 2
        localBox.max.z = center.z + shape.size.z / 2
        this.current = this.box.initFromBox(localBox, world)
        this.box.getBoundingBox(this.worldBox)
        break
      }
      case 'cylinder': {
        this.current = this.cylinder.initFromTransform(center, shape.radius, shape.height, world)
        this.cylinder.getBoundingBox(this.worldBox)
        break
      }
    }
  }

  /**
   * Checks whether the volume of this collider overlaps the volume of the other collider
   *
   * @remarks
   * Uses the current world volumes, call {@link updateVolume} on both colliders before
   */
  public intersects(other: ColliderComponent): boolean {
    const a = this.current
    const b = other.current
    if (a instanceof BoundingSphere) {
      return b.intersectsSphere(a)
    }
    if (b instanceof BoundingSphere) {
      return a.intersectsSphere(b)
    }
    return gjkIntersects(a, b)
  }

  /**
   * Checks whether the given point is inside the volume
   */
  public intersectsPoint(point: IVec3): boolean {
    return this.current.intersectsPoint(point)
  }

  /**
   * Checks whether the given sphere overlaps the volume
   */
  public intersectsSphere(sphere: BoundingSphere): boolean {
    return this.current.intersectsSphere(sphere)
  }

  /**
   * Calculates the distance along the ray where it enters the volume
   *
   * @returns the distance in units of the ray direction, `0` if the ray starts inside or `NaN` if the ray misses
   */
  public intersectsRayAt(ray: IRay): number {
    const volume = this.current
    if (volume instanceof BoundingSphere) {
      return volume.intersectsPoint(ray.position) ? 0 : rayIntersectsSphereAt(ray, volume)
    }
    return volume.intersectsRayAt(ray)
  }
}

/**
 * Creates a {@link ColliderComponent} with a sphere shape
 *
 * @public
 */
export function sphereCollider(radius: number, options?: Omit<ColliderComponentOptions, 'shape'> & { center?: IVec3 }) {
  return new ColliderComponent({ ...options, shape: { type: 'sphere', radius, center: options?.center } })
}

/**
 * Creates a {@link ColliderComponent} with a box shape
 *
 * @public
 */
export function boxCollider(size: IVec3, options?: Omit<ColliderComponentOptions, 'shape'> & { center?: IVec3 }) {
  return new ColliderComponent({ ...options, shape: { type: 'box', size, center: options?.center } })
}

/**
 * Creates a {@link ColliderComponent} with a cylinder shape
 *
 * @public
 */
export function cylinderCollider(
  radius: number,
  height: number,
  options?: Omit<ColliderComponentOptions, 'shape'> & { center?: IVec3 },
) {
  return new ColliderComponent({ ...options, shape: { type: 'cylinder', radius, height, center: options?.center } })
}
