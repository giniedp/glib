import type { RegionHeightmap } from '../../terrain/heightSampling'
import { PlayerBlock, type PlayerRequest, type PlayerResult } from '../shared'
import type { CollisionToMain, MainToCollision } from './protocol'
import { resolvePlayer, type CollisionWorld } from './resolvePlayer'
import { ShapeAssets } from './ShapeAssets'

export interface CollisionEngineOptions {
  post: (message: CollisionToMain, transfer?: Transferable[]) => void
}

export class CollisionEngine implements CollisionWorld {
  public post: CollisionEngineOptions['post']

  public readonly heightmaps = new Map<string, RegionHeightmap>()
  private player: PlayerBlock | null = null
  private assets: ShapeAssets
  private request: PlayerRequest = { x: 0, y: 0, z: 0, dt: 0, flags: 0 }
  private result: PlayerResult = { x: 0, y: 0, z: 0 }

  public constructor(options: CollisionEngineOptions) {
    this.post = options.post
  }

  public handle(message: MainToCollision) {
    switch (message.type) {
      case 'init': {
        this.assets = new ShapeAssets(message.filesUrl)
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
      resolvePlayer(this, this.request, this.result)
      player.writeResult(seen, this.result)
      resolved = seen
    }
  }
}
