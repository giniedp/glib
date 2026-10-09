import { BoundsComponent, LifeCycleFlags, TransformComponent } from '@gglib/components'
import { type ActivatableComponent, type CreateEntityOptions, type GameComponent, type GameEntity } from '@gglib/ecs'
import { BoundingBox, BoundingSphere, mat4CreateFromArray } from '@gglib/math'
import {
  ChunkType,
  type AssetReference,
  type CapitalRuntimeData,
  type ChunkRuntimeData,
  type ViewerSlice,
} from '../../api'
import { DebugLayer, DebugShapeComponent } from '../debug/DebugShapeComponent'
import type { RegionImpostorComponent } from '../region/RegionImpostorComponent'
import { RangeActivationSystem } from './RangeActivationSystem'

/**
 * Finds the POI impostor cell at a world position
 */
export type ImpostorCellLookup = (x: number, y: number) => RegionImpostorComponent | null

export interface SliceSpawnerComponentOptions {
  isChunk?: boolean
  /**
   * The slice is a collision chunk, spawned only while collision is shown
   */
  isCollision?: boolean
  /**
   * Size of the chunk, if this is a chunk slice
   */
  chunkSize?: number
  /**
   * Impostor cell that spawns this chunk
   */
  cell?: RegionImpostorComponent | null

  slice: AssetReference
}

export function capitalSliceEntityOptions(parent: GameEntity, data: CapitalRuntimeData): CreateEntityOptions {
  return {
    name: data.slice.hint,
    parent,
    transform: new TransformComponent({
      keepWorld: true,
      world: mat4CreateFromArray(data.transform),
      lifeCycle: LifeCycleFlags.PropagateOnly, // is controlled by SliceSystem
    }),
    components: [
      new DebugShapeComponent({
        type: 'bounds-sphere',
        color: { x: 1, y: 0, z: 0 },
        layer: DebugLayer.Slice,
      }),
      new BoundsComponent({
        sphere: BoundingSphere.create(0, 0, 0, data.radius),
      }),
      new SliceSpawnerComponent({
        slice: data.slice,
      }),
    ],
  }
}

export function chunkSliceEntityOptions(
  parent: GameEntity,
  data: ChunkRuntimeData,
  cell: RegionImpostorComponent | null,
): CreateEntityOptions {
  const half = data.size * 0.5
  return {
    name: data.slice.hint,
    parent,
    transform: new TransformComponent({
      keepWorld: true,
      world: mat4CreateFromArray(data.transform),
      lifeCycle: LifeCycleFlags.PropagateOnly, // is controlled by SliceSystem
    }),
    components: [
      new BoundsComponent({
        // chunk position is the cell center
        box: BoundingBox.create(-half, -half, -half, half, half, half),
      }),
      new DebugShapeComponent({
        type: 'bounds-box',
        color: { x: 1, y: 1, z: 0 },
        layer: DebugLayer.Slice,
      }),
      new SliceSpawnerComponent({
        isChunk: true,
        isCollision: data.chunkType === ChunkType.Collision,
        chunkSize: data.size,
        cell,
        slice: data.slice,
      }),
    ],
  }
}

export class SliceSpawnerComponent implements GameComponent, ActivatableComponent {
  public entity: GameEntity
  public slice: AssetReference
  public bounds: BoundsComponent
  private rangeSystem: RangeActivationSystem
  public rangeEntities: GameEntity[] = []

  public data: ViewerSlice
  public spawnRadius: number
  public isLoaded: boolean
  public isSpawned: boolean
  public readonly isChunk: boolean
  public readonly isCollision: boolean
  public readonly chunkSize: number

  /**
   * Impostor cell that spawns this chunk, the SliceSystem does not spawn it by distance
   */
  public readonly impostor: RegionImpostorComponent | null

  /**
   * Cells that activate mesh entities of this slice
   */
  public readonly memberCells = new Set<RegionImpostorComponent>()
  public readonly slices: SliceSpawnerComponent[] = []

  public constructor(data: SliceSpawnerComponentOptions) {
    this.slice = data.slice
    this.isChunk = !!data.isChunk
    this.isCollision = !!data.isCollision
    this.chunkSize = data.chunkSize ?? 0
    this.impostor = data.cell ?? null
    this.spawnRadius = 0
  }

  public initialize(): void {
    this.bounds = this.entity.component(BoundsComponent)
    this.rangeSystem = this.entity.world.getSystem(RangeActivationSystem)
  }

  public activate(): void {
    //
  }

  public unload() {
    //
  }

  public deactivate(): void {
    //
  }

  public destroy(): void {
    for (const entity of this.rangeEntities) {
      this.rangeSystem.remove(entity)
    }
    this.rangeEntities.length = 0
    for (const cell of this.memberCells) {
      cell.removeMembers(this.entity)
    }
    this.memberCells.clear()
  }
}
