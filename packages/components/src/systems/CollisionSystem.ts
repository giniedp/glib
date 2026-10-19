import { GameEntity, GameQuery, GameSystem, GameWorld } from '@gglib/ecs'
import { Color } from '@gglib/graphics'
import { BoundingSphere, IRay, IVec3, IVec4, rayPositionAt, vec3 } from '@gglib/math'
import { ColliderComponent, CollisionEvent } from '../components/ColliderComponent'
import { DebugDrawSystem } from './DebugDrawSystem'

/**
 * Filter options for the {@link CollisionSystem} queries
 *
 * @public
 */
export interface CollisionQueryOptions {
  /**
   * Only colliders with `collider.layer & mask` are considered. Defaults to all layers
   */
  mask?: number
}

/**
 * Options for {@link CollisionSystem.raycast}
 *
 * @public
 */
export interface RaycastOptions extends CollisionQueryOptions {
  /**
   * Hits further away are ignored, in units of the ray direction
   */
  maxDistance?: number
}

/**
 * Result of a {@link CollisionSystem.raycast}
 *
 * @public
 */
export interface RaycastHit {
  collider: ColliderComponent
  entity: GameEntity
  /**
   * Distance to the hit point in units of the ray direction, `0` if the ray starts inside the collider
   */
  distance: number
  /**
   * The point where the ray enters the collider
   */
  point: IVec3
}

/**
 * Constructor options for {@link CollisionSystem}
 *
 * @public
 */
export interface CollisionSystemOptions {
  /**
   * See {@link CollisionSystem.debugDraw}
   */
  debugDraw?: boolean
}

interface CollisionPair {
  key: number
  a: ColliderComponent
  b: ColliderComponent
  ab: CollisionEvent
  ba: CollisionEvent
  /**
   * The last update in which the colliders overlapped
   */
  frame: number
}

const ALL_LAYERS = 0xffffffff
const querySphere = new BoundingSphere()

/**
 * Detects overlapping {@link ColliderComponent}s and emits their collision events
 *
 * @public
 * @remarks
 * Collisions are only detected, never resolved. Answers whether colliders touch and what a ray hits.
 * Use a physics engine if objects should bounce off each other.
 *
 * The system is not added by default. Add it in `onInitialize` of the game, so it runs after the behaviors
 * moved the entities, otherwise the events lag one frame behind.
 *
 * The queries accept an optional `out` parameter to reuse result objects and arrays.
 *
 * Set {@link debugDraw} to draw the colliders with the {@link DebugDrawSystem}, which must be added to the world.
 */
export class CollisionSystem extends GameSystem {
  /**
   * Draws the world volumes of the colliders with the {@link DebugDrawSystem}
   */
  public debugDraw = false

  /**
   * Debug color of colliders that do not overlap
   */
  public debugColor: IVec4 = Color.Lime

  /**
   * Debug color of colliders that overlap
   */
  public debugColorColliding: IVec4 = Color.Red

  protected world: GameWorld
  protected query: GameQuery
  protected colliders: ColliderComponent[] = []
  /**
   * Separate list for the queries, so they can be called from collision event handlers during {@link update}
   */
  protected queryColliders: ColliderComponent[] = []

  /**
   * Pairs that overlapped in the last update, by pair key
   */
  protected pairsByKey = new Map<number, CollisionPair>()
  /**
   * Pairs that overlapped in the last update
   */
  protected pairs: CollisionPair[] = []
  /**
   * Pairs of the current update, swapped with {@link pairs}
   */
  protected pairsNext: CollisionPair[] = []
  /**
   * Released pairs for reuse
   */
  protected pairPool: CollisionPair[] = []
  protected frame = 0
  protected debug: DebugDrawSystem | null = null

  public constructor(options?: CollisionSystemOptions) {
    super()
    this.debugDraw = options?.debugDraw ?? this.debugDraw
  }

  public override initialize(world: GameWorld): void {
    this.world = world
    this.query = world.query({ scope: 'active', required: [ColliderComponent] })
  }

  public override destroy(): void {
    this.pairsByKey.clear()
    this.pairs.length = 0
    this.pairsNext.length = 0
    this.pairPool.length = 0
  }

  public override update(): void {
    const frame = ++this.frame
    const colliders = this.collectColliders(this.colliders, true)
    const byKey = this.pairsByKey
    const next = this.pairsNext
    let count = 0

    for (let i = 0; i < colliders.length; i++) {
      const a = colliders[i]
      for (let j = i + 1; j < colliders.length; j++) {
        const b = colliders[j]
        if (!(a.layer & b.mask) || !(b.layer & a.mask)) {
          continue
        }
        if (!a.worldBox.intersectsBox(b.worldBox) || !a.intersects(b)) {
          continue
        }
        const key = pairKey(a.entity.refId, b.entity.refId)
        let pair = byKey.get(key)
        if (pair) {
          // a pair in the map overlapped in the last update
          pair.frame = frame
          if (pair.a.emitStay) {
            pair.a.entity.events.emit(ColliderComponent.onCollisionStay, pair.ab)
          }
          if (pair.b.emitStay) {
            pair.b.entity.events.emit(ColliderComponent.onCollisionStay, pair.ba)
          }
        } else {
          pair = this.acquirePair(key, a, b, frame)
          byKey.set(key, pair)
          a.entity.events.emit(ColliderComponent.onCollisionEnter, pair.ab)
          b.entity.events.emit(ColliderComponent.onCollisionEnter, pair.ba)
        }
        a.colliding = true
        b.colliding = true
        next[count++] = pair
      }
    }
    next.length = count

    // pairs of the last update that were not touched stopped overlapping,
    // or a collider was disabled, deactivated or destroyed
    const previous = this.pairs
    for (let i = 0; i < previous.length; i++) {
      const pair = previous[i]
      if (pair.frame === frame) {
        continue
      }
      byKey.delete(pair.key)
      pair.a.entity.events.emit(ColliderComponent.onCollisionExit, pair.ab)
      pair.b.entity.events.emit(ColliderComponent.onCollisionExit, pair.ba)
      this.releasePair(pair)
    }

    this.pairs = next
    this.pairsNext = previous

    if (this.debugDraw) {
      this.drawColliders(colliders)
    }
  }

  private drawColliders(colliders: ColliderComponent[]) {
    this.debug ??= this.world.getSystem(DebugDrawSystem, { optional: true })
    if (!this.debug) {
      return
    }
    for (let i = 0; i < colliders.length; i++) {
      const collider = colliders[i]
      // drawn into the scene of the collider
      this.debug
        .in(collider.entity)
        ?.volume(collider.volume, collider.colliding ? this.debugColorColliding : this.debugColor)
    }
  }

  /**
   * Finds the closest collider hit by the ray
   *
   * @param ray - the ray to cast
   * @param options - filter options
   * @param out - where to write the result. A new object is created if not given
   * @returns the hit or `null` if nothing was hit
   */
  public raycast(ray: IRay, options?: RaycastOptions, out?: RaycastHit): RaycastHit | null {
    const mask = options?.mask ?? ALL_LAYERS
    let closest: ColliderComponent | null = null
    let closestDistance = options?.maxDistance ?? Number.POSITIVE_INFINITY

    const colliders = this.collectColliders(this.queryColliders, false)
    for (let i = 0; i < colliders.length; i++) {
      const collider = colliders[i]
      if (!(collider.layer & mask)) {
        continue
      }
      const distance = collider.intersectsRayAt(ray)
      if (distance <= closestDistance) {
        closest = collider
        closestDistance = distance
      }
    }
    if (!closest) {
      return null
    }
    return writeHit(out || createHit(), ray, closest, closestDistance)
  }

  /**
   * Finds all colliders hit by the ray, sorted by distance
   *
   * @param ray - the ray to cast
   * @param options - filter options
   * @param out - where to write the result. Contained hit objects are reused
   */
  public raycastAll(ray: IRay, options?: RaycastOptions, out: RaycastHit[] = []): RaycastHit[] {
    const mask = options?.mask ?? ALL_LAYERS
    const maxDistance = options?.maxDistance ?? Number.POSITIVE_INFINITY
    let count = 0

    const colliders = this.collectColliders(this.queryColliders, false)
    for (let i = 0; i < colliders.length; i++) {
      const collider = colliders[i]
      if (!(collider.layer & mask)) {
        continue
      }
      const distance = collider.intersectsRayAt(ray)
      if (!(distance <= maxDistance)) {
        continue
      }
      // insertion sort, keeps the hit objects of the out array
      const hit = writeHit(out[count] || createHit(), ray, collider, distance)
      let k = count++
      while (k > 0 && out[k - 1].distance > distance) {
        out[k] = out[k - 1]
        k--
      }
      out[k] = hit
    }
    out.length = count
    return out
  }

  /**
   * Finds all colliders that contain the point
   *
   * @param point - the point to test
   * @param options - filter options
   * @param out - where to write the result
   */
  public overlapPoint(point: IVec3, options?: CollisionQueryOptions, out: ColliderComponent[] = []): ColliderComponent[] {
    const mask = options?.mask ?? ALL_LAYERS
    let count = 0
    const colliders = this.collectColliders(this.queryColliders, false)
    for (let i = 0; i < colliders.length; i++) {
      const collider = colliders[i]
      if (collider.layer & mask && collider.intersectsPoint(point)) {
        out[count++] = collider
      }
    }
    out.length = count
    return out
  }

  /**
   * Finds all colliders that overlap the sphere
   *
   * @param center - the sphere center
   * @param radius - the sphere radius
   * @param options - filter options
   * @param out - where to write the result
   */
  public overlapSphere(
    center: IVec3,
    radius: number,
    options?: CollisionQueryOptions,
    out: ColliderComponent[] = [],
  ): ColliderComponent[] {
    const mask = options?.mask ?? ALL_LAYERS
    querySphere.initFromCenterRadius(center, radius)
    let count = 0
    const colliders = this.collectColliders(this.queryColliders, false)
    for (let i = 0; i < colliders.length; i++) {
      const collider = colliders[i]
      if (collider.layer & mask && collider.intersectsSphere(querySphere)) {
        out[count++] = collider
      }
    }
    out.length = count
    return out
  }

  /**
   * Collects the enabled colliders of active entities and updates their world volumes
   *
   * @param result - where to write the colliders
   * @param resetColliding - resets the `colliding` flag, only at the start of an update
   */
  private collectColliders(result: ColliderComponent[], resetColliding: boolean): ColliderComponent[] {
    let count = 0
    for (const entity of this.query) {
      const collider = entity.component(ColliderComponent)
      if (resetColliding) {
        collider.colliding = false
      }
      if (collider.enabled) {
        collider.updateVolume()
        result[count++] = collider
      }
    }
    result.length = count
    return result
  }

  private acquirePair(key: number, a: ColliderComponent, b: ColliderComponent, frame: number): CollisionPair {
    const pair = this.pairPool.pop()
    if (!pair) {
      return { key, a, b, ab: { self: a, other: b }, ba: { self: b, other: a }, frame }
    }
    pair.key = key
    pair.a = pair.ab.self = pair.ba.other = a
    pair.b = pair.ab.other = pair.ba.self = b
    pair.frame = frame
    return pair
  }

  private releasePair(pair: CollisionPair) {
    // drop the references, so destroyed entities can be collected
    pair.a = pair.ab.self = pair.ba.other = null
    pair.b = pair.ab.other = pair.ba.self = null
    this.pairPool.push(pair)
  }
}

/**
 * Unique number for an unordered pair of ids (Cantor pairing)
 */
function pairKey(idA: number, idB: number) {
  const lo = idA < idB ? idA : idB
  const hi = idA < idB ? idB : idA
  return ((lo + hi) * (lo + hi + 1)) / 2 + hi
}

function createHit(): RaycastHit {
  return { collider: null, entity: null, distance: 0, point: vec3() }
}

function writeHit(hit: RaycastHit, ray: IRay, collider: ColliderComponent, distance: number): RaycastHit {
  hit.collider = collider
  hit.entity = collider.entity
  hit.distance = distance
  rayPositionAt(ray, distance, hit.point)
  return hit
}
