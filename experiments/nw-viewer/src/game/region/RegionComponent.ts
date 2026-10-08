import {
  BoundsComponent,
  LifeCycleFlags,
  MeshComponent,
  OccTree,
  PriorityLane,
  SchedulerSystem,
  SpatialComponent,
  TaskCancelledError,
  TransformComponent,
  type ScheduledTask,
} from '@gglib/components'
import { GetComponent, type CreateEntityOptions, type GameComponent, type GameEntity, type Type } from '@gglib/ecs'
import { mat4CreateTranslation, vec3, vec3AddScalar, vec3Copy, type IVec3 } from '@gglib/math'

import { lfmt } from '@gglib/utils'
import {
  getRegionCapitalsUrl,
  getRegionInfoUrl,
  type CapitalRuntimeData,
  type ChunkRuntimeData,
  type RegionCapitalsData,
  type RegionImpostor,
  type RegionInfo,
} from '../../api'
import {
  ENABLE_CAPITALS,
  ENABLE_CHUNKS,
  ENABLE_DISTRIBUTION,
  ENABLE_IMPOSTOR_POI,
  ENABLE_IMPOSTOR_VEG,
  ENABLE_VEGETATION,
} from '../../constants'
import { ContentService } from '../../content'
import { DistributionComponent } from '../distribution/DistributionComponent'
import {
  capitalSliceEntityOptions,
  chunkSliceEntityOptions,
  SliceSpawnerComponent,
} from '../slice/SliceSpawnerComponent'
import { TerrainRegionComponent } from '../terrain/TerrainRegionComponent'
import { VegetationComponent } from '../vegetation/VegetationComponent'
import { impostorEntityOptions, RegionImpostorComponent } from './RegionImpostorComponent'

export interface RegionComponentOptions {
  coatlicueName: string
  regionName: string
  regionSize: number
  oceanLevel: number
  mountainHeight: number
  cellSize: number
  origin: IVec3
  enableDistribution: boolean
  enableVegetation: boolean
  enableChunks: boolean
}

export function regionEntityOptions(parent: GameEntity, options: RegionComponentOptions): CreateEntityOptions {
  const min = vec3Copy(options.origin)
  const max = vec3AddScalar(options.origin, options.regionSize)

  return {
    name: options.regionName,
    parent,
    transform: new TransformComponent({
      world: mat4CreateTranslation(options.origin),
      lifeCycle: LifeCycleFlags.Propagate, // is controlled by RegionSystem
      keepWorld: true,
    }),
    components: [
      new BoundsComponent(),
      new MeshComponent(),
      new SpatialComponent({
        index: OccTree.create({
          min,
          max,
          leafLevel: 5,
          looseFactor: 2,
        }),
      }),
      new RegionComponent(options),
    ],
  }
}

export class RegionTagComponent implements GameComponent {
  public region: RegionComponent
  public entity: GameEntity
  public initialize(): void {
    this.region = this.entity.component(RegionComponent, GetComponent.OptionalFollowParent)
  }
  public activate(): void {}
  public deactivate(): void {}
  public destroy(): void {}
}

export class RegionComponent implements GameComponent {
  public static readonly Tag = RegionTagComponent
  public readonly Tag: Type<RegionTagComponent> = class extends RegionTagComponent {}

  public readonly entity: GameEntity
  public readonly coatlicueName: string
  public readonly regionName: string
  public readonly regionSize: number
  public readonly cellSize: number
  public readonly min: IVec3
  public readonly max: IVec3

  public readonly oceanLevel: number
  public readonly mountainHeight: number
  public readonly enableDistribution: boolean
  public readonly enableVegetation: boolean
  public readonly enableChunks: boolean
  /**
   * POI impostor cells by local cell index
   */
  private poiCells = new Map<number, RegionImpostorComponent>()

  private scheduler: SchedulerSystem
  private content: ContentService

  public impostors: GameEntity | null
  public capitals: GameEntity | null
  public terrain: GameEntity | null
  public distribution: GameEntity | null
  public vegetation: GameEntity | null

  public regionInfo: RegionInfo | null
  public regionInfoTask: ScheduledTask | null

  public capitalData: RegionCapitalsData | null
  public capitalDataTask: ScheduledTask | null
  private capitalLayers: Record<string, GameEntity> = {}

  public slices: SliceSpawnerComponent[] = []
  private logTag = lfmt.badge('#4E79A7', 'RegionComponent')

  public constructor(data: RegionComponentOptions) {
    this.logTag = lfmt.merge(this.logTag, lfmt.badge('#BAB0AC', `${data.regionName}`))
    this.coatlicueName = data.coatlicueName
    this.regionName = data.regionName
    this.regionSize = data.regionSize
    this.cellSize = data.cellSize
    this.oceanLevel = data.oceanLevel
    this.mountainHeight = data.mountainHeight
    this.enableDistribution = data.enableDistribution
    this.enableVegetation = data.enableVegetation
    this.enableChunks = !!data.enableChunks
    this.min = vec3Copy(data.origin)
    this.max = vec3AddScalar(data.origin, data.regionSize)
  }

  public initialize(): void {
    this.scheduler = this.entity.service(SchedulerSystem)
    this.content = this.entity.service(ContentService)

    this.impostors = this.entity.world.createEntity({
      name: 'Impostors',
      parent: this.entity,
      transform: new TransformComponent(),
    })

    this.capitals = this.entity.world.createEntity({
      name: 'Capitals',
      parent: this.entity,
      transform: new TransformComponent(),
    })

    this.terrain = this.entity.world.createEntity({
      name: 'Terrain',
      parent: this.entity,
      transform: new TransformComponent(),
      components: [
        new TerrainRegionComponent({
          regionName: this.regionName,
          coatlicueName: this.coatlicueName,
          origin: vec3Copy(this.min),
          regionSize: this.regionSize,
          mountainHeight: this.mountainHeight,
          regionMaterial: null,
        }),
      ],
    })

    if (ENABLE_DISTRIBUTION && this.enableDistribution) {
      this.distribution = this.entity.world.createEntity({
        name: 'Distribution',
        parent: this.entity,
        transform: new TransformComponent(),
        components: [
          new MeshComponent(),
          new DistributionComponent({
            coatlicueName: this.coatlicueName,
            regionName: this.regionName,
            regionSize: this.regionSize,
            cellSize: this.cellSize,
            mountainHeight: this.mountainHeight,
            origin: vec3Copy(this.min),
            terrain: this.terrain.component(TerrainRegionComponent),
          }),
        ],
      })
    }

    if (ENABLE_VEGETATION && this.enableVegetation) {
      this.vegetation = this.entity.world.createEntity({
        name: 'Vegetation',
        parent: this.entity,
        transform: new TransformComponent(),
        components: [
          new MeshComponent(),
          new VegetationComponent({
            coatlicueName: this.coatlicueName,
            regionName: this.regionName,
            regionSize: this.regionSize,
            mountainHeight: this.mountainHeight,
            origin: vec3Copy(this.min),
          }),
        ],
      })
    }
  }

  public destroy(): void {
    //
  }

  public activate(): void {
    this.loadRegionInfo()
  }

  public deactivate(): void {
    if (this.regionInfoTask) {
      this.regionInfoTask.cancelled = true
      this.regionInfoTask = null
    }

    if (this.capitalDataTask) {
      this.capitalDataTask.cancelled = true
      this.capitalDataTask = null
    }
  }

  private loadRegionInfo() {
    if (this.regionInfo || this.regionInfoTask) {
      return
    }
    console.log(...this.logTag, 'Loading info')
    this.regionInfoTask = this.scheduler.schedule<RegionInfo>({
      // terrain materials and impostors depend on the region info
      lane: PriorityLane.Critical,
      label: `Load region info ${this.regionName}`,
      entity: this.entity,
      context: null,
      load: async (task) => {
        task.context = await this.content.fetchTypedRequest(getRegionInfoUrl(this.coatlicueName, this.regionName))
      },
      work: (task) => {
        const info = task.context
        console.log(...this.logTag, 'Info loaded', info)

        this.regionInfo = info
        this.terrain.component(TerrainRegionComponent).materialData = info.terrainMaterial
        this.createImpostorLayers(info)

        return true
      },
      finalize: (task, err) => {
        if (this.regionInfoTask !== task) {
          return
        }
        this.regionInfoTask = null

        if (err instanceof TaskCancelledError) {
          return
        }

        this.loadCapitalData()
      },
    })
  }

  private loadCapitalData() {
    if (this.capitalData || this.capitalDataTask) {
      return
    }
    console.log(...this.logTag, `Loading capitals`)
    this.capitalDataTask = this.scheduler.schedule<RegionCapitalsData>({
      lane: PriorityLane.High,
      label: `Load capital data ${this.regionName}`,
      entity: this.entity,
      context: null,
      load: async (task) => {
        task.context = await this.content.fetchTypedRequest(getRegionCapitalsUrl(this.coatlicueName, this.regionName))
      },
      work: (task) => {
        const data = task.context
        this.capitalData = data
        this.content.updateSlices(data.slices)
        console.log(...this.logTag, 'Capital data loaded', data)
        if (ENABLE_CAPITALS) {
          this.createCapitals(data.capitals)
        }
        if (ENABLE_CHUNKS) {
          this.createChunks(data.chunks)
        }
        return true
      },
      finalize: (task, err) => {
        if (this.capitalDataTask === task) {
          this.capitalDataTask = null
        }
      },
    })
  }

  private createImpostorLayers(data: RegionInfo) {
    if (ENABLE_IMPOSTOR_VEG) {
      this.createImpostorLayer(data.impostors, false)
    }
    if (ENABLE_IMPOSTOR_POI) {
      this.createImpostorLayer(data.poiImpostors, true)
    }
  }

  private createImpostorLayer(impostor: RegionImpostor[], isPOI: boolean) {
    if (!impostor) {
      return
    }
    for (const item of impostor) {
      const options = impostorEntityOptions(this.impostors, {
        name: item.model,
        model: item.model,
        origin: vec3(item.position.x, item.position.y, 0),
        regionSize: this.regionSize,
        cellSize: this.cellSize,
        isPOI,
      })
      const entity = this.entity.world.createEntity(options)
      if (isPOI) {
        this.poiCells.set(this.cellIndex(item.position.x, item.position.y), entity.component(RegionImpostorComponent))
      }
    }
  }

  private cellIndex(x: number, y: number) {
    const count = Math.round(this.regionSize / this.cellSize)
    const ix = Math.floor((x - this.min.x) / this.cellSize)
    const iy = Math.floor((y - this.min.y) / this.cellSize)
    return ix + iy * count
  }

  /**
   * The POI impostor cell at a world position, if the cell has a POI impostor
   */
  public poiCellAt(x: number, y: number): RegionImpostorComponent | null {
    return this.poiCells.get(this.cellIndex(x, y)) || null
  }

  public createCapitals(layers: Record<string, CapitalRuntimeData[]>) {
    if (!layers) {
      return
    }
    for (const key in layers) {
      const parent = this.getCapitalLayerEntity(key)
      for (const item of layers[key]) {
        const options = capitalSliceEntityOptions(parent, item)
        const entity = this.entity.world.createEntity(options)
        this.slices.push(entity.component(SliceSpawnerComponent))
      }
    }
  }

  public createChunks(layers: Record<string, ChunkRuntimeData[]>) {
    if (!layers) {
      return
    }
    for (const key in layers) {
      const parent = this.getCapitalLayerEntity(key)
      for (const item of layers[key]) {
        if (item.chunkType === 2) {
          // collision chunks have no entities
          continue
        }
        // chunks that fit into one impostor cell are spawned by that cell
        const cell =
          this.enableChunks && item.size <= this.cellSize
            ? this.poiCellAt(item.transform[12], item.transform[13])
            : null
        const options = chunkSliceEntityOptions(parent, item, cell)
        const entity = this.entity.world.createEntity(options)
        const spawner = entity.component(SliceSpawnerComponent)
        this.slices.push(spawner)
        if (cell) {
          cell.chunks.push(spawner)
        }
      }
    }
  }

  private getCapitalLayerEntity(layer: string) {
    console.assert(!!layer, 'Layer name is required')

    let entity = this.capitalLayers[layer]
    if (!entity) {
      entity = this.entity.world.createEntity({
        name: layer,
        parent: this.capitals,
        transform: new TransformComponent(),
      })
      this.capitalLayers[layer] = entity
    }
    return entity
  }
}
