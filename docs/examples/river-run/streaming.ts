import { ContentLoader } from '@gglib/content'
import { EcsGame, ModelComponent, TransformComponent } from '@gglib/components'
import { GameEntity, GameSystem, GameWorld, SystemOrder } from '@gglib/ecs'
import type { Model } from '@gglib/model'
import { BLOCK, COLUMNS, MAX_LEVEL, MODELS, PARKED_Y, WATER_LEVEL } from './constants'
import { ObstacleComponent } from './obstacles'
import { type Ground, type PartList, River, type Row, rowZ } from './river'

/**
 * The entities placed for a row or an obstacle, they go back to the pool together
 */
export interface Placement {
  entities: GameEntity[]
  models: string[]
  count: number
}

interface SpawnedRow extends Placement {
  index: number
}

/**
 * The block model of the ground at a level of a column: sand, grass on top, snow on the highest hills, dirt below
 */
function groundModel(ground: Ground, top: number, level: number) {
  if (ground === 'sand') {
    return MODELS.sand
  }
  if (level < top) {
    return MODELS.dirt
  }
  return top >= MAX_LEVEL ? MODELS.snow : MODELS.grass
}

/**
 * Streams the river: places the rows and obstacles that come into view at the top of the screen and returns those
 * that left the screen at the bottom.
 *
 * Nothing is created or destroyed while racing: every model placement is an entity that is reused for the same
 * model, unused entities are parked below the scene. Obstacles are entities with an {@link ObstacleComponent},
 * they are recycled as well. Each model is loaded once, the renderer draws all its entities as instances
 */
export class RiverStreamingSystem extends GameSystem {
  // after the camera moved, so the rows match the screen
  public override order: number = SystemOrder.Default + 3

  /**
   * The generated river
   */
  public readonly river = new River(0)
  /**
   * The obstacles on the river
   */
  public readonly obstacles: ObstacleComponent[] = []
  /**
   * The z of the bottom and top edge of the screen on the water, set by the camera
   */
  public viewBottom = 0
  public viewTop = 0
  /**
   * Half width of the scenery on the screen, from the center of the river. Columns further out are not placed
   */
  public viewHalfWidth = Infinity

  private world!: GameWorld
  private content!: ContentLoader
  private scene!: GameEntity
  private readonly models = new Map<string, Promise<Model>>()
  // unused entities by model, unused rows and unused obstacles
  private readonly modelPool = new Map<string, GameEntity[]>()
  private readonly rowPool: SpawnedRow[] = []
  private readonly obstaclePool: ObstacleComponent[] = []
  private readonly rows: SpawnedRow[] = []
  private nextRow = 0
  private fillView = false

  public initialize(world: GameWorld): void {
    this.world = world
    this.content = world.getSystem(ContentLoader)
    this.scene = world.getSystem(EcsGame).scene.entity
  }

  public destroy(): void {
    //
  }

  /**
   * Starts a new river. The rows and obstacles of the old one go back to the pools
   */
  public restart(seed: number) {
    while (this.rows.length) {
      this.releaseRow(this.rows.pop()!)
    }
    while (this.obstacles.length) {
      this.releaseObstacle(this.obstacles.pop()!)
    }
    this.river.restart(seed)
    this.nextRow = 0
    // everything in view at once on the next update, later rows are spawned a few per frame
    this.fillView = true
  }

  public override update(): void {
    this.spawn(this.fillView ? Infinity : 4)
    this.fillView = false
    this.despawn()
  }

  /**
   * Places the rows and obstacles that come into view, at most `maxRows` rows
   */
  private spawn(maxRows: number) {
    // a bit beyond the top edge of the screen, so tall models don't pop in
    const limit = this.viewTop + 3 * BLOCK
    for (let spawned = 0; spawned < maxRows && rowZ(this.nextRow) < limit; spawned++) {
      this.river.ensure(this.nextRow + 1)
      this.spawnRow(this.river.row(this.nextRow)!)
      this.nextRow++
    }
    const pending = this.river.obstacles
    while (pending.length && pending[0].z < rowZ(this.nextRow)) {
      const obstacle = this.obstaclePool.pop() ?? this.createObstacle()
      obstacle.data = pending.shift()!
      this.placeParts(obstacle.placement, obstacle.data, obstacle.data.x, obstacle.data.z)
      this.obstacles.push(obstacle)
    }
  }

  /**
   * A row of blocks. Land is a stack of blocks up to its level, with dirt below the top block. Only the blocks
   * that can be seen are placed: from the top down to the lowest neighbor
   */
  private spawnRow(row: Row) {
    const spawned = this.rowPool.pop() ?? { entities: [], models: [], count: 0, index: 0 }
    spawned.index = row.index
    const z = rowZ(row.index)
    const river = this.river
    for (let i = 0; i < COLUMNS; i++) {
      if (Math.abs(i - COLUMNS / 2 + 0.5) * BLOCK > this.viewHalfWidth) {
        continue
      }
      const { ground, level } = row.cells[i]
      const column = i - COLUMNS / 2 + row.offset
      const x = (column + 0.5) * BLOCK
      if (ground === 'water') {
        this.place(spawned, MODELS.water, x, WATER_LEVEL - BLOCK / 2, z)
        continue
      }
      const lowest = Math.min(
        river.levelAt(column - 1, row.index),
        river.levelAt(column + 1, row.index),
        river.levelAt(column, row.index - 1),
        river.levelAt(column, row.index + 1),
      )
      for (let k = Math.min(level, lowest + 1); k <= level; k++) {
        this.place(spawned, groundModel(ground, level, k), x, k * BLOCK - BLOCK / 2, z)
      }
    }
    // the decoration outside of the screen as well
    this.placeParts(spawned, row, 0, z, row.offset * BLOCK)
    this.rows.push(spawned)
  }

  /**
   * Returns the rows and obstacles below the bottom edge of the screen to the pools
   */
  private despawn() {
    const behind = this.viewBottom - 2 * BLOCK
    while (this.rows.length && rowZ(this.rows[0].index) < behind) {
      this.releaseRow(this.rows.shift()!)
    }
    // keeps the order of the remaining obstacles
    let kept = 0
    for (let i = 0; i < this.obstacles.length; i++) {
      const obstacle = this.obstacles[i]
      if (obstacle.data!.z < behind - 4) {
        this.releaseObstacle(obstacle)
      } else {
        this.obstacles[kept++] = obstacle
      }
    }
    this.obstacles.length = kept
  }

  private releaseRow(row: SpawnedRow) {
    this.release(row)
    this.rowPool.push(row)
  }

  private releaseObstacle(obstacle: ObstacleComponent) {
    this.release(obstacle.placement)
    this.river.release(obstacle.data!)
    obstacle.data = null
    this.obstaclePool.push(obstacle)
  }

  private createObstacle(): ObstacleComponent {
    return this.world
      .createEntity({
        name: 'Obstacle',
        parent: this.scene,
        transform: new TransformComponent(),
        components: [new ObstacleComponent()],
      })
      .$(ObstacleComponent)
  }

  /**
   * Places the parts of a row or an obstacle, relative to a position. With a `centerX`, parts further than the view
   * half width from it are skipped
   */
  private placeParts(placement: Placement, list: PartList, x: number, z: number, centerX?: number) {
    for (let i = 0; i < list.partCount; i++) {
      const part = list.parts[i]
      if (centerX != null && Math.abs(part.x - centerX) > this.viewHalfWidth) {
        continue
      }
      this.place(placement, part.model, x + part.x, part.y, z + part.z, part.yaw, part.scale)
    }
  }

  /**
   * Places a model, takes an unused entity of the pool if there is one
   */
  private place(placement: Placement, model: string, x: number, y: number, z: number, yaw = 0, scale = 1) {
    const entity = this.pool(model).pop() ?? this.createModelEntity(model)
    const transform = entity.$(TransformComponent)
    transform.setPosition(x, y, z)
    transform.setRotationAxisAngle(0, 1, 0, yaw)
    transform.setScaleUniform(scale)
    placement.entities[placement.count] = entity
    placement.models[placement.count] = model
    placement.count++
  }

  /**
   * Parks the entities of a placement below the scene and returns them to the pool
   */
  private release(placement: Placement) {
    for (let i = 0; i < placement.count; i++) {
      const entity = placement.entities[i]
      entity.$(TransformComponent).setPosition(0, PARKED_Y, 0)
      this.pool(placement.models[i]).push(entity)
    }
    placement.count = 0
  }

  private pool(model: string): GameEntity[] {
    let pool = this.modelPool.get(model)
    if (!pool) {
      pool = []
      this.modelPool.set(model, pool)
    }
    return pool
  }

  private createModelEntity(url: string): GameEntity {
    const entity = this.world.createEntity({
      parent: this.scene,
      transform: new TransformComponent(),
      components: [new ModelComponent()],
    })
    let model = this.models.get(url)
    if (!model) {
      model = this.content.loadModel(url)
      this.models.set(url, model)
    }
    model.then((loaded) => {
      if (!entity.isDestroyed) {
        entity.$(ModelComponent).model = loaded.instantiate()
      }
    })
    return entity
  }
}
