import { EcsGame } from '@gglib/components'
import { GameSystem, type GameWorld } from '@gglib/ecs'
import { mat4GetTranslation, vec3, vec3DistanceSquared } from '@gglib/math'
import { COLLISION_DEBUG_RANGE, COLLISION_LOAD_CONCURRENCY } from '../../constants'
import { DebugLayer } from '../debug/DebugShapeComponent'
import { DebugShapeSystem } from '../debug/DebugShapeSystem'
import type { CollisionComponent } from './CollisionComponent'
import type { MainToCollision } from './worker/protocol'

/**
 * Registry of the active collision shapes.
 *
 * While a collision debug layer is enabled, shape assets of nearby colliders are loaded (nearest first)
 * so their debug shapes can be drawn. Collision chunks are spawned only while collision is enabled.
 */
export class CollisionSystem extends GameSystem {
  private game: EcsGame
  private world: GameWorld
  private debugShapes: DebugShapeSystem
  private worker: Worker

  /**
   * Active collision components
   */
  public readonly components = new Set<CollisionComponent>()
  /**
   * Active collision components whose shape asset is not loaded yet
   */
  private pending = new Set<CollisionComponent>()
  private loading = 0
  private camera = vec3()
  private position = vec3()

  /**
   * Whether collision is shown (any collision debug layer is enabled)
   */
  public get isEnabled() {
    // the debug shape system may be added after this one, resolved lazily
    this.debugShapes ??= this.world.getSystem(DebugShapeSystem, { optional: true })
    return !!this.debugShapes?.isLayerEnabled(DebugLayer.Collision | DebugLayer.CollisionVolume)
  }

  public initialize(world: GameWorld): void {
    this.world = world
    this.game = world.getSystem(EcsGame)
    this.worker = new Worker(new URL('./worker/worker.ts', import.meta.url), {
      type: 'module',
      name: 'collision',
    })
  }

  public add(component: CollisionComponent) {
    this.components.add(component)
    if (component.rnr && component.state === 'idle') {
      this.pending.add(component)
    }
  }

  public remove(component: CollisionComponent) {
    this.components.delete(component)
    this.pending.delete(component)
  }

  public update(): void {
    if (!this.pending.size || !this.isEnabled || this.loading >= COLLISION_LOAD_CONCURRENCY) {
      return
    }
    mat4GetTranslation(this.game.scene.getView(0).camera.world, this.camera)
    const rangeSq = COLLISION_DEBUG_RANGE * COLLISION_DEBUG_RANGE
    const candidates: Array<{ component: CollisionComponent; distance: number }> = []
    for (const component of this.pending) {
      if (!this.debugShapes.isLayerEnabled(component.layer)) {
        continue
      }
      const distance = vec3DistanceSquared(component.getPosition(this.position), this.camera)
      if (distance <= rangeSq) {
        candidates.push({ component, distance })
      }
    }
    candidates.sort((a, b) => a.distance - b.distance)
    for (const { component } of candidates) {
      if (this.loading >= COLLISION_LOAD_CONCURRENCY) {
        break
      }
      this.pending.delete(component)
      this.loading++
      component.load().finally(() => {
        this.loading--
      })
    }
  }

  public post(message: MainToCollision) {
    this.worker.postMessage(message)
  }

  public destroy(): void {
    this.components.clear()
    this.pending.clear()
    this.worker.terminate()
  }
}
