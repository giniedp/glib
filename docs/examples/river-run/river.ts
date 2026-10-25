import { fbm, perlin } from '@gglib/noise'
import {
  BLOCK,
  CARGO,
  COLUMNS,
  CONTAINERS,
  INNER_LANES,
  LANE_COLUMNS,
  LANES,
  LOW_TRAFFIC,
  MAX_LEVEL,
  MODELS,
  PROPS,
  RIVER_HALF,
  RIVER_WIDTH,
  ROW_CAPACITY,
  STONES,
  TRAFFIC,
  WATER_LEVEL,
} from './constants'

export type Ground = 'water' | 'sand' | 'grass'

export interface Cell {
  ground: Ground
  /**
   * Level of the top of the ground in blocks, its top is at `level * BLOCK`. Water and sand are at level 0
   */
  level: number
}

/**
 * A model placed relative to the center of an obstacle, or in world space for a row
 */
export interface Part {
  model: string
  x: number
  y: number
  z: number
  yaw: number
  scale: number
}

/**
 * A list of parts. The part objects are reused, only the first `partCount` are in use
 */
export interface PartList {
  parts: Part[]
  partCount: number
}

export interface Row extends PartList {
  index: number
  /**
   * The river center of this row in columns, the cells are centered on it
   */
  offset: number
  /**
   * The ground of each column, from left (-x) to right (+x)
   */
  cells: Cell[]
}

export type ObstacleKind = 'boat' | 'stones' | 'island' | 'piles' | 'container' | 'cargo' | 'buoy' | 'ramp'

export interface Obstacle extends PartList {
  kind: ObstacleKind
  x: number
  z: number
  /**
   * Half extents of the collision rectangle on the water
   */
  halfX: number
  halfZ: number
  /**
   * A boat in the air passes above an obstacle that is lower than this. Ramps: height of the high end
   */
  height: number
  /**
   * Speed along +z, only for boats
   */
  speed: number
  /**
   * Distance from the river center, the boats keep it when the river curves
   */
  lane: number
}

/**
 * Center z of a row
 */
export function rowZ(index: number): number {
  return (index + 0.5) * BLOCK
}

// a small seeded random generator (mulberry32), the same seed builds the same river
function random(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function createRow(): Row {
  const cells: Cell[] = []
  for (let i = 0; i < COLUMNS; i++) {
    cells.push({ ground: 'water', level: 0 })
  }
  return { index: -1, offset: 0, cells, parts: [], partCount: 0 }
}

/**
 * Adds a part to a list, reuses a part object of an earlier use of the list
 */
function addPart(list: PartList, model: string, x: number, y: number, z: number, yaw = 0, scale = 1) {
  let part = list.parts[list.partCount]
  if (!part) {
    part = { model, x, y, z, yaw, scale }
    list.parts.push(part)
  }
  list.partCount++
  part.model = model
  part.x = x
  part.y = y
  part.z = z
  part.yaw = yaw
  part.scale = scale
}

/**
 * Generates the river procedurally, section by section. Rows and obstacles are only data, the game turns them
 * into entities when they come into view.
 *
 * The course of the river and the height of the land are noise fields, so they are known for any position
 * before the rows are generated.
 *
 * Rows live in a ring buffer and obstacles are recycled, so a running game does not allocate new objects
 */
export class River {
  /**
   * Obstacles that are not spawned yet, ordered by z
   */
  public readonly obstacles: Obstacle[] = []
  /**
   * Number of generated rows
   */
  public length = 0

  private readonly ring: Row[] = []
  private readonly pool: Obstacle[] = []
  private readonly course = perlin()
  private readonly hills = perlin().pipe(fbm({ octaves: 3 }))
  private rand!: () => number
  private noiseZ = 0

  public constructor(seed: number) {
    for (let i = 0; i < ROW_CAPACITY; i++) {
      this.ring.push(createRow())
    }
    this.restart(seed)
  }

  /**
   * Starts a new river, the rows and obstacles of the old one are reused
   */
  public restart(seed: number) {
    this.rand = random(seed)
    // moves the noise to another place for every seed
    this.noiseZ = (seed % 997) + 0.5
    for (const row of this.ring) {
      row.index = -1
    }
    while (this.obstacles.length) {
      this.release(this.obstacles.pop()!)
    }
    this.length = 0
    // a calm start without obstacles, then open water with a few obstacles
    this.open(16, 0)
    this.open(12, 0.1)
  }

  /**
   * The row with the given index, `null` if it is not generated or was overwritten
   */
  public row(index: number): Row | null {
    const row = this.ring[((index % ROW_CAPACITY) + ROW_CAPACITY) % ROW_CAPACITY]
    return row.index === index ? row : null
  }

  /**
   * Returns an obstacle that is not used any more, for the next sections
   */
  public release(obstacle: Obstacle) {
    obstacle.partCount = 0
    this.pool.push(obstacle)
  }

  /**
   * The center of the river at a position along the course. It runs straight at the start and curves later on
   */
  public centerX(z: number): number {
    const fadeIn = Math.min(1, Math.max(0, (z - 40) / 80))
    return this.course.sample(z * 0.012, 0.5, this.noiseZ) * 16 * fadeIn
  }

  /**
   * The river center of a row in columns. The banks move by whole blocks
   */
  public rowOffset(row: number): number {
    return Math.round(this.centerX(rowZ(row)) / BLOCK)
  }

  /**
   * The level of the land in a column of a row: hills from a noise field that rise with the distance to the river.
   * Water, sand and islands are at level 0
   */
  public levelAt(column: number, row: number): number {
    // distance in blocks from the outer edge of the sand
    const distance = Math.abs(column - this.rowOffset(row) + 0.5) - 0.5 - (RIVER_HALF + 1)
    if (distance < 0) {
      return 0
    }
    const noise = this.hills.sample(column * 0.17, row * 0.17, this.noiseZ)
    const level = Math.round(noise * 3 + Math.min(distance, 5) * 0.3)
    // no cliffs next to the sand
    const max = distance < 1 ? 1 : MAX_LEVEL
    return Math.max(0, Math.min(max, level))
  }

  /**
   * Generates sections until the river has at least the given number of rows
   */
  public ensure(rows: number) {
    while (this.length < rows) {
      // obstacles get denser and walls lose their gap over the first 400 rows
      const difficulty = Math.min(1, this.length / 400)
      // calm water between the sections, a bit less later on
      for (let i = Math.round(5 - difficulty * 2); i > 0; i--) {
        this.addRow()
      }
      const pick = this.rand()
      if (pick < 0.35) {
        this.open(16 + this.int(8), difficulty)
      } else if (pick < 0.5) {
        this.islandSplit(difficulty)
      } else if (pick < 0.65) {
        this.buoySplit(difficulty)
      } else if (pick < 0.82) {
        this.rampWall(difficulty)
      } else {
        this.traffic(difficulty)
      }
    }
  }

  /**
   * The ground at a position, rows that are not generated or already overwritten are open water
   */
  public groundAt(x: number, z: number): Ground {
    const index = Math.floor(z / BLOCK)
    const row = this.row(index)
    const offset = row ? row.offset : this.rowOffset(index)
    if (!row) {
      return Math.abs(x - offset * BLOCK) < RIVER_WIDTH ? 'water' : 'grass'
    }
    const column = Math.floor(x / BLOCK) - offset + COLUMNS / 2
    return column >= 0 && column < COLUMNS ? row.cells[column].ground : 'grass'
  }

  private int(max: number) {
    return Math.floor(this.rand() * max)
  }

  private pick<T>(items: readonly T[]): T {
    return items[this.int(items.length)]
  }

  /**
   * Adds a row. Columns closer to the river center than `island` blocks are land, an island splits the river.
   * The island is sand at its ends
   */
  private addRow(island = 0, islandSand = false): Row {
    const index = this.length++
    const row = this.ring[index % ROW_CAPACITY]
    row.index = index
    row.offset = this.rowOffset(index)
    row.partCount = 0
    for (let c = 0; c < COLUMNS; c++) {
      const block = Math.abs(c - COLUMNS / 2 + 0.5) + 0.5
      let ground: Ground = 'grass'
      if (block <= island) {
        ground = islandSand ? 'sand' : 'grass'
      } else if (block <= RIVER_HALF) {
        ground = 'water'
      } else if (block <= RIVER_HALF + 1) {
        ground = 'sand'
      }
      const cell = row.cells[c]
      cell.ground = ground
      cell.level = this.levelAt(c - COLUMNS / 2 + row.offset, index)
    }
    this.decorateShore(row)
    return row
  }

  /**
   * Center x of a column of a row in world space
   */
  private cellX(row: Row, column: number) {
    return (column - COLUMNS / 2 + row.offset + 0.5) * BLOCK
  }

  /**
   * Trees on the grass and props on the shore, standing on the ground of their column
   */
  private decorateShore(row: Row) {
    for (let column = 0; column < COLUMNS; column++) {
      const cell = row.cells[column]
      const x = this.cellX(row, column)
      const top = cell.level * BLOCK
      if (cell.ground === 'grass' && this.rand() < 0.07) {
        this.tree(row, x, top)
      } else if (cell.ground !== 'water' && this.rand() < 0.025) {
        // a block on the ground
        addPart(row, this.pick(PROPS), x, top + BLOCK / 2, 0)
      } else if (cell.ground === 'sand' && this.rand() < 0.02) {
        // a blue container on the shore, lengthwise
        addPart(row, MODELS.containerBlue, x, top, 0)
      }
    }
  }

  /**
   * A tree: a trunk of two thin wood blocks and a block of leaves
   */
  private tree(list: PartList, x: number, top: number) {
    addPart(list, MODELS.wood, x, top + 0.5, 0, 0, 0.5)
    addPart(list, MODELS.wood, x, top + 1.5, 0, 0, 0.5)
    addPart(list, top >= MAX_LEVEL * BLOCK ? MODELS.treeSnow : MODELS.tree, x, top + 3, 0)
  }

  /**
   * Adds an obstacle in a lane of the row at z, keeps the list ordered by z
   */
  private addObstacle(
    kind: ObstacleKind,
    lane: number,
    z: number,
    halfX: number,
    halfZ: number,
    height: number,
    speed = 0,
  ): Obstacle {
    const obstacle =
      this.pool.pop() ??
      ({ kind, x: 0, z: 0, halfX: 0, halfZ: 0, height: 0, speed: 0, lane: 0, parts: [], partCount: 0 } as Obstacle)
    obstacle.kind = kind
    obstacle.lane = lane
    // the river center of the row the obstacle is in
    obstacle.x = this.rowOffset(Math.floor(z / BLOCK)) * BLOCK + lane
    obstacle.z = z
    obstacle.halfX = halfX
    obstacle.halfZ = halfZ
    obstacle.height = height
    obstacle.speed = speed
    obstacle.partCount = 0
    const list = this.obstacles
    list.push(obstacle)
    for (let i = list.length - 1; i > 0 && list[i - 1].z > z; i--) {
      list[i] = list[i - 1]
      list[i - 1] = obstacle
    }
    return obstacle
  }

  /**
   * Open water with obstacles in some lanes, at least one lane stays free
   */
  private open(rows: number, difficulty: number) {
    const start = this.length
    for (let i = 0; i < rows; i++) {
      this.addRow()
    }
    if (difficulty === 0) {
      return
    }
    // rows between two rows of obstacles, a bit less later on
    const spacing = Math.round(8 - difficulty * 2)
    for (let index = start + 2; index < start + rows - 1; index += spacing + this.int(2)) {
      // one lane, sometimes a second, different one
      const first = this.int(LANES.length)
      this.landmark(LANES[first], rowZ(index))
      if (this.rand() < 0.3 + difficulty * 0.4) {
        this.landmark(LANES[(first + 1 + this.int(LANES.length - 1)) % LANES.length], rowZ(index))
      }
    }
  }

  /**
   * One of the static obstacles in a lane. Blocks stand on one of the two columns of the lane
   */
  private landmark(lane: number, z: number) {
    const column = this.pick(LANE_COLUMNS[lane])
    const pick = this.rand()
    if (pick < 0.22) {
      // a stone block sticking out of the water, sometimes two on top of each other
      const it = this.addObstacle('stones', column, z, 1, 1, 2)
      addPart(it, this.pick(STONES), 0, 0, 0)
      if (this.rand() < 0.5) {
        addPart(it, MODELS.stone, 0, BLOCK, 0)
      }
    } else if (pick < 0.38) {
      // a tiny island with a tree
      const it = this.addObstacle('island', column, z, 1, 1, 3)
      addPart(it, MODELS.grass, 0, -1, 0)
      this.tree(it, 0, 0)
    } else if (pick < 0.55) {
      // a mooring pile of wood blocks
      const it = this.addObstacle('piles', column, z, 1, 1, 3)
      addPart(it, MODELS.wood, 0, 0, 0)
      addPart(it, MODELS.wood, 0, BLOCK, 0)
    } else if (pick < 0.8) {
      // a floating container, lengthwise or across
      const across = this.rand() < 0.5
      const it = this.addObstacle('container', lane, z, across ? 1.4 : 0.7, across ? 0.7 : 1.4, 0.8)
      addPart(it, this.pick(CONTAINERS), 0, WATER_LEVEL - 0.3, 0, across ? Math.PI / 2 : 0)
    } else {
      const it = this.addObstacle('cargo', lane, z, 1.3, 1.4, 0.9)
      addPart(it, this.pick(CARGO), 0, WATER_LEVEL - 0.3, 0)
    }
  }

  /**
   * An island splits the river into two arms
   */
  private islandSplit(difficulty: number) {
    this.addRow()
    const rows = 8 + this.int(5)
    const start = this.length
    for (let i = 0; i < rows; i++) {
      const end = i === 0 || i === rows - 1
      const row = this.addRow(1, end)
      if (!end && i % 3 === 1) {
        // a tree on the island, in its left column
        this.tree(row, this.cellX(row, COLUMNS / 2 - 1), 0)
      }
    }
    this.addRow()
    // something in one of the arms
    if (this.rand() < 0.4 + difficulty * 0.5) {
      this.landmark(this.rand() < 0.5 ? -6 : 6, rowZ(start + 2 + this.int(rows - 4)))
    }
  }

  /**
   * A line of buoys splits the river, one side is blocked further ahead
   */
  private buoySplit(difficulty: number) {
    this.addRow()
    const rows = 14
    const start = this.length
    for (let i = 0; i < rows; i++) {
      this.addRow()
    }
    for (let z = rowZ(start); z < rowZ(start + rows - 1); z += 3) {
      const it = this.addObstacle('buoy', 0, z, 0.45, 0.45, 1.2)
      addPart(it, z === rowZ(start) ? MODELS.buoyFlag : MODELS.buoy, 0, WATER_LEVEL, 0)
    }
    const side = this.rand() < 0.5 ? -1 : 1
    this.landmark(side * this.pick(INNER_LANES), rowZ(start + 5))
    if (this.rand() < difficulty) {
      this.landmark(-side * this.pick(INNER_LANES), rowZ(start + 11))
    }
  }

  /**
   * A wall of containers across the river with a ramp in front of it. Early walls have a gap at the shore
   */
  private rampWall(difficulty: number) {
    this.addRow()
    const start = this.length
    for (let i = 0; i < 7; i++) {
      this.addRow()
    }
    const gapSide = this.rand() < 1 - difficulty * 0.7 ? (this.rand() < 0.5 ? -1 : 1) : 0
    const wallZ = rowZ(start + 4)
    // six containers lie across, 2.8 wide each. A gap of one container at the shore, if any
    for (let i = 0; i < 6; i++) {
      if (gapSide && (gapSide < 0 ? i === 0 : i === 5)) {
        continue
      }
      const it = this.addObstacle('container', (i - 2.5) * 2.8, wallZ, 1.4, 0.7, 0.8)
      addPart(it, this.pick(CONTAINERS), 0, WATER_LEVEL - 0.3, 0, Math.PI / 2)
    }
    // the high end of the ramp is 2 units before the wall
    const wide = this.rand() < 1 - difficulty * 0.5
    const halfX = wide ? 2.57 : 1.36
    const lane = (this.rand() - 0.5) * 2 * (RIVER_WIDTH - halfX - 1.5)
    const it = this.addObstacle('ramp', lane, wallZ - 0.7 - 2 - 1.41, halfX, 1.41, 1.14)
    addPart(it, wide ? MODELS.rampWide : MODELS.ramp, 0, WATER_LEVEL, 0)
  }

  /**
   * Slow boats ahead, they block lanes for a while
   */
  private traffic(difficulty: number) {
    const start = this.length
    const rows = 20
    for (let i = 0; i < rows; i++) {
      this.addRow()
    }
    const count = 2 + Math.round(difficulty * 2)
    // a different lane for each boat
    const firstLane = this.int(LANES.length)
    for (let i = 0; i < count; i++) {
      const model = this.int(TRAFFIC.length)
      const lane = LANES[(firstLane + i) % LANES.length] + (this.rand() - 0.5)
      const z = rowZ(start + 2 + i * 4 + this.int(2))
      const height = model < LOW_TRAFFIC ? 0.8 : 1.5
      const it = this.addObstacle('boat', lane, z, 0.9, 1.8, height, 1 + this.rand() * 1.5)
      addPart(it, TRAFFIC[model], 0, WATER_LEVEL, 0)
    }
  }
}
