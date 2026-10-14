import { EcsGame } from '@gglib/components'
import { GameSystem, type GameQuery, type GameWorld } from '@gglib/ecs'
import { mat4GetTranslation, vec3, vec3DistanceSquared } from '@gglib/math'
import { COLLISION_DEBUG_RANGE, COLLISION_LOAD_CONCURRENCY } from '../../constants'
import { ContentService } from '../../content'
import type { RnrAsset } from '../../formats/rnr/types'
import { DebugLayer } from '../debug/DebugShapeComponent'
import { DebugShapeSystem } from '../debug/DebugShapeSystem'
import { isSharedMemoryAvailable } from '../shared/sharedMemory'
import { TerrainRegionComponent } from '../terrain/TerrainRegionComponent'
import type { CollisionComponent } from './CollisionComponent'
import { PlayerBlock } from './shared'
import type { CollisionToMain, MainToCollision } from './worker/protocol'

/**
 * Registry of the active collision shapes.
 *
 * While a collision debug layer is enabled, shape assets of nearby colliders are loaded (nearest first)
 * so their debug shapes can be drawn. Shape assets are fetched and parsed by the collision worker. Collision chunks are spawned only while collision is enabled.
 *
 * Owns the collision worker, which resolves the player position for the grounded movement mode. Terrain
 * heightmaps of the loaded regions are shared with the worker.
 */
export class CollisionSystem extends GameSystem {
  private game: EcsGame
  private world: GameWorld
  private debugShapes: DebugShapeSystem
  private worker: Worker
  private terrainQuery: GameQuery
  private sentHeightmaps = new Map<string, Float16Array<ArrayBufferLike>>()
  private activeHeightmaps = new Set<string>()
  /**
   * Parsed shape assets requested from the worker (debug view), by file path
   */
  private shapes = new Map<string, Promise<RnrAsset>>()
  private shapeRequests = new Map<number, { resolve: (asset: RnrAsset) => void; reject: (err: Error) => void }>()
  private nextRequestId = 1

  /**
   * Player position shared with the worker, null if shared memory is not available (page not cross origin isolated)
   */
  public readonly player: PlayerBlock | null = isSharedMemoryAvailable() ? new PlayerBlock() : null

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
    this.worker.addEventListener('message', (event: MessageEvent<CollisionToMain>) => this.handle(event.data))
    this.worker.addEventListener('error', (event) => console.error('collision worker error', event))
    this.terrainQuery = world.query({ scope: 'active', required: [TerrainRegionComponent] })
    const content = world.getSystem(ContentService)
    this.post({
      type: 'init',
      player: this.player?.buffer ?? null,
      filesUrl: new URL(content.nwbtFileUrl, self.location.href).href,
    })
    if (!this.player) {
      console.warn('shared memory is not available, grounded movement is disabled')
    }
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
    if (this.player) {
      this.syncHeightmaps()
    }
    this.updateDebugLoading()
  }

  private handle(message: CollisionToMain) {
    switch (message.type) {
      case 'ready':
        break
      case 'shape': {
        const request = this.shapeRequests.get(message.requestId)
        this.shapeRequests.delete(message.requestId)
        if (message.asset) {
          request?.resolve(message.asset)
        } else {
          request?.reject(new Error(message.error))
        }
        break
      }
    }
  }

  /**
   * Loads a parsed shape asset through the worker, cached by file path
   */
  public loadShape(path: string): Promise<RnrAsset> {
    let task = this.shapes.get(path)
    if (!task) {
      const requestId = this.nextRequestId++
      task = new Promise<RnrAsset>((resolve, reject) => {
        this.shapeRequests.set(requestId, { resolve, reject })
      })
      this.shapes.set(path, task)
      this.post({ type: 'shape', requestId, path })
    }
    return task
  }

  /**
   * Shares the heightmaps of the active terrain regions with the worker
   */
  private syncHeightmaps() {
    const active = this.activeHeightmaps
    active.clear()
    for (const entity of this.terrainQuery) {
      const region = entity.component(TerrainRegionComponent)
      if (!region.heightmapReady || !region.heightmap) {
        continue
      }
      active.add(region.regionName)
      if (this.sentHeightmaps.get(region.regionName) === region.heightmap) {
        continue
      }
      this.sentHeightmaps.set(region.regionName, region.heightmap)
      this.post({
        type: 'heightmapAdd',
        id: region.regionName,
        originX: region.origin.x,
        originY: region.origin.y,
        size: region.size,
        mountainHeight: region.mountainHeight,
        heightmap: region.heightmap,
      })
    }
    for (const id of this.sentHeightmaps.keys()) {
      if (!active.has(id)) {
        this.sentHeightmaps.delete(id)
        this.post({ type: 'heightmapRemove', id })
      }
    }
  }

  private updateDebugLoading() {
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
    this.sentHeightmaps.clear()
    this.shapes.clear()
    this.shapeRequests.clear()
    this.worker.terminate()
  }
}
