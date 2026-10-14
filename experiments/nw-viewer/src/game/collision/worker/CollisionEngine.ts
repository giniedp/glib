import { vec3 } from '@gglib/math'
import type { RegionHeightmap } from '../../terrain/heightSampling'
import { PlayerBlock, PlayerFlags, type PlayerRequest, type PlayerResult } from '../shared'
import { CollisionWorld } from './CollisionWorld'
import type { CollisionToMain, MainToCollision } from './protocol'
import { resolvePlayer, type PlayerWorld } from './resolvePlayer'
import { ShapeAssets } from './ShapeAssets'

export interface CollisionEngineOptions {
  post: (message: CollisionToMain, transfer?: Transferable[]) => void
}

export class CollisionEngine implements PlayerWorld {
  public post: CollisionEngineOptions['post']

  public readonly heightmaps = new Map<string, RegionHeightmap>()
  public colliders: CollisionWorld
  private player: PlayerBlock | null = null
  private assets: ShapeAssets
  private request: PlayerRequest = { x: 0, y: 0, z: 0, dt: 0, flags: 0 }
  private result: PlayerResult = { x: 0, y: 0, z: 0 }
  /**
   * Feet position of the previous result, walls are swept from there
   */
  private previous = vec3()
  private resolveTime = 0
  private resolveMax = 0
  private resolveCount = 0

  public constructor(options: CollisionEngineOptions) {
    this.post = options.post
  }

  public handle(message: MainToCollision) {
    switch (message.type) {
      case 'init': {
        this.assets = new ShapeAssets(message.filesUrl)
        this.colliders = new CollisionWorld(this.assets)
        if (message.player) {
          this.player = new PlayerBlock(message.player)
          this.runPlayerLoop()
        }
        this.post({ type: 'ready' })
        break
      }
      case 'heightmapAdd': {
        this.heightmaps.set(message.id, {
          heightmap: message.heightmap,
          origin: { x: message.originX, y: message.originY },
          size: message.size,
          mountainHeight: message.mountainHeight,
        })
        break
      }
      case 'heightmapRemove': {
        this.heightmaps.delete(message.id)
        break
      }
      case 'colliders': {
        for (const id of message.remove) {
          this.colliders.remove(id)
        }
        for (const info of message.add) {
          this.colliders.add(info)
        }
        break
      }
      case 'stats': {
        this.post({
          type: 'stats',
          stats: {
            ...this.colliders.stats,
            heightmaps: this.heightmaps.size,
            resolveMs: this.resolveCount ? this.resolveTime / this.resolveCount : 0,
            resolveMaxMs: this.resolveMax,
          },
        })
        this.resolveTime = 0
        this.resolveMax = 0
        this.resolveCount = 0
        break
      }
      case 'shape': {
        this.sendShape(message.requestId, message.path)
        break
      }
    }
  }

  private async sendShape(requestId: number, path: string) {
    try {
      const asset = await this.assets.load(path)
      this.post({ type: 'shape', requestId, asset })
    } catch (err) {
      this.post({ type: 'shape', requestId, error: String(err) })
    }
  }

  /**
   * Resolves each player request, waits asynchronously so messages are still handled in between
   */
  private async runPlayerLoop() {
    const player = this.player
    // last value seen in the input sequence slot, 0 while a request is being written
    let seen = 0
    let resolved = 0
    while (this.player === player) {
      await player.waitRequest(seen)
      seen = player.readRequest(this.request)
      if (!seen || seen === resolved) {
        continue
      }
      const request = this.request
      if (request.flags & PlayerFlags.Teleport) {
        this.previous.x = request.x
        this.previous.y = request.y
        this.previous.z = request.z
      }
      this.colliders.loadNear(request.x, request.y)
      const start = performance.now()
      resolvePlayer(this, request, this.previous, this.result)
      const time = performance.now() - start
      this.resolveTime += time
      this.resolveMax = Math.max(this.resolveMax, time)
      this.resolveCount++
      player.writeResult(seen, this.result)
      this.previous.x = this.result.x
      this.previous.y = this.result.y
      this.previous.z = this.result.z
      resolved = seen
    }
  }
}
