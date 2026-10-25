import { TransformComponent } from '@gglib/components'
import { GameComponent, GameEntity, GameQuery, GameSystem, GameWorld, SystemOrder } from '@gglib/ecs'
import type { Obstacle } from './river'
import { RiverStreamingSystem, type Placement } from './streaming'

/**
 * An obstacle on the river. The entities are recycled: an unused obstacle has no `data`
 */
export class ObstacleComponent implements GameComponent {
  public readonly entity!: GameEntity
  /**
   * The generated obstacle, `null` while the entity waits in the pool
   */
  public data: Obstacle | null = null
  /**
   * The models of the obstacle
   */
  public readonly placement: Placement = { entities: [], models: [], count: 0 }

  /**
   * Moves the obstacle and its models
   */
  public moveTo(x: number, z: number) {
    const data = this.data!
    data.x = x
    data.z = z
    for (let i = 0; i < this.placement.count; i++) {
      const part = data.parts[i]
      this.placement.entities[i].$(TransformComponent).setPosition(x + part.x, part.y, z + part.z)
    }
  }
}

/**
 * Drives the slow boats on the river once they come close to the screen. They keep their distance to the river
 * center where the river curves, and stop behind obstacles in their way
 */
export class TrafficSystem extends GameSystem {
  public override order: number = SystemOrder.Default + 1

  private query!: GameQuery
  private streaming!: RiverStreamingSystem

  public initialize(world: GameWorld): void {
    this.query = world.query({ scope: 'active', required: [ObstacleComponent] })
    this.streaming = world.getSystem(RiverStreamingSystem)
  }

  public destroy(): void {
    //
  }

  public override update(time: number, dt: number): void {
    const river = this.streaming.river
    if (!river) {
      return
    }
    const start = this.streaming.viewTop + 30
    for (const entity of this.query) {
      const obstacle = entity.$(ObstacleComponent)
      const boat = obstacle.data
      if (!boat || boat.kind !== 'boat' || boat.z > start || this.isBlocked(boat)) {
        continue
      }
      const z = boat.z + boat.speed * dt
      obstacle.moveTo(boat.lane + river.centerX(z), z)
    }
  }

  /**
   * Whether an obstacle is right in front of a boat. Called while the query is iterated, a query can't be iterated
   * twice at the same time, so this goes through the list of the streaming system
   */
  private isBlocked(boat: Obstacle) {
    const obstacles = this.streaming.obstacles
    for (let i = 0; i < obstacles.length; i++) {
      const it = obstacles[i].data
      if (
        it &&
        it !== boat &&
        it.kind !== 'ramp' &&
        Math.abs(it.x - boat.x) < it.halfX + boat.halfX &&
        it.z > boat.z &&
        it.z - boat.z < it.halfZ + boat.halfZ + 1
      ) {
        return true
      }
    }
    return false
  }
}
