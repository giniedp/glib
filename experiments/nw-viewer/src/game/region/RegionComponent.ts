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
import { Mat4, Vec3, type IVec3 } from '@gglib/math'

import { lfmt } from '@gglib/utils'
import {
  getRegionCapitalsUrl,
  getRegionInfoUrl,
  type CapitalRuntimeData,
  type ChunkRuntimeData,
  type RegionCapitalsData,
  type RegionInfo,
} from '../../api'
import { ENABLE_CAPITALS, ENABLE_IMPOSTORS } from '../../constants'
import { ContentService } from '../../content'
import {
  capitalSliceEntityOPtions,
  chunkSliceEntityOptions,
  SliceSpawnerComponent,
} from '../slice/SliceSpawnerComponent'
import { TerrainRegionComponent } from '../terrain/TerrainRegionComponent'
import { impostorEntityOptions } from './RegionImpostorComponent'

export interface RegionComponentOptions {
  coatlicueName: string
  regionName: string
  regionSize: number
  oceanLevel: number
  mountainHeight: number
  cellSize: number
  origin: IVec3
}

export function regionEntityOptions(parent: GameEntity, options: RegionComponentOptions): CreateEntityOptions {
  const min = Vec3.copy(options.origin)
  const max = Vec3.copy(options.origin).addScalar(options.regionSize)

  return {
    name: options.regionName,
    parent,
    transform: new TransformComponent({
      world: Mat4.createTranslation(options.origin),
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

  private scheduler: SchedulerSystem
  private content: ContentService

  public impostors: GameEntity | null
  public capitals: GameEntity | null
  public terrain: GameEntity | null

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
    this.min = Vec3.copy(data.origin)
    this.max = Vec3.copy(data.origin).addScalar(data.regionSize)
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
          origin: Vec3.copy(this.min),
          regionSize: this.regionSize,
          mountainHeight: this.mountainHeight,
          regionMaterial: null,
        }),
      ],
    })
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
      lane: PriorityLane.Medium,
      label: `Load region info ${this.regionName}`,
      entity: this.entity,
      context: null,
      load: async (task) => {
        task.context = await this.content.fetchTypedRequest(getRegionInfoUrl(this.coatlicueName, this.regionName))
      },
      work: (task) => {
        const info = task.context
        this.regionInfo = info
        this.terrain.component(TerrainRegionComponent).materialData = info.terrainMaterial
        console.log(...this.logTag, 'Info loaded', info)
        if (ENABLE_IMPOSTORS) {
          this.createImpostors(info)
        } else {
          console.warn(...this.logTag, 'Impostors are disabled, skipping creation of impostor entities')
        }
        return true
      },
      finalize: (task, err) => {
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
      lane: PriorityLane.Medium,
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
          this.createChunks(data.chunks)
        } else {
          console.warn(...this.logTag, 'Capitals are disabled, skipping creation of capital and chunk entities')
        }
        return true
      },
      finalize: (task, err) => {
        this.capitalDataTask = null
      },
    })
  }

  public createImpostors(data: RegionInfo) {
    const impostors = [...(data.impostors || []), ...(data.poiImpostors || [])]
    for (const item of impostors) {
      const options = impostorEntityOptions(this.impostors, {
        name: item.model,
        model: item.model,
        origin: Vec3.create(item.position.x, item.position.y, 0),
        regionSize: this.regionSize,
        cellSize: this.cellSize,
      })
      this.entity.world.createEntity(options)
    }
  }

  public createCapitals(layers: Record<string, CapitalRuntimeData[]>) {
    for (const key in layers) {
      const parent = this.getCapitalLayerEntity(key)
      for (const item of layers[key]) {
        const options = capitalSliceEntityOPtions(parent, item)
        const entity = this.entity.world.createEntity(options)
        this.slices.push(entity.component(SliceSpawnerComponent))
      }
    }
  }

  public createChunks(layers: Record<string, ChunkRuntimeData[]>) {
    for (const key in layers) {
      const parent = this.getCapitalLayerEntity(key)
      for (const item of layers[key]) {
        const options = chunkSliceEntityOptions(parent, item)
        const entity = this.entity.world.createEntity(options)
        this.slices.push(entity.component(SliceSpawnerComponent))
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
