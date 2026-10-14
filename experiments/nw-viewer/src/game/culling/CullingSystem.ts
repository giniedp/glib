import { EcsGame } from '@gglib/components'
import { GameSystem, GameWorld } from '@gglib/ecs'
import type { MainToCulling } from './worker/protocol'

/**
 * Registry of the active collision shapes.
 *
 * While a collision debug layer is enabled, shape assets of nearby colliders are loaded (nearest first)
 * so their debug shapes can be drawn. Collision chunks are spawned only while collision is enabled.
 */
export class CullingSystem extends GameSystem {
  private game: EcsGame
  private world: GameWorld
  private worker: Worker

  public initialize(world: GameWorld): void {
    this.world = world
    this.game = world.getSystem(EcsGame)
    this.worker = new Worker(new URL('./worker/worker.ts', import.meta.url), {
      type: 'module',
      name: 'culling',
    })
  }

  public update(): void {
    //
  }

  public post(message: MainToCulling) {
    this.worker.postMessage(message)
  }

  public destroy(): void {
    this.worker.terminate()
  }
}
