import { type CreateEntityOptions, type GameComponent, type GameEntity } from '@gglib/ecs'
import { fetchTypedRequest, getRegionInfoUrl, type ImpostorData, type RegionData } from '../../api'

import {
  BoundsComponent,
  LifeCycleFlags,
  MeshComponent,
  OccTree,
  PriorityLane,
  SchedulerSystem,
  SpatialRootComponent,
  TransformComponent,
} from '@gglib/components'

import { boxBoxIntersects, boxMat4DistanceSquared, Mat4, Vec3, type IVec3 } from '@gglib/math'
import type { CameraData } from '@gglib/render'
import { SEGMENT_SIZE } from '../../constants'
import { ContentService } from '../../content'
import { SliceSpawnerComponent } from '../slice/SliceSpawnerComponent'
import { levelSegment, RegionSegmentComponent } from './RegionSegmentComponent'

export interface RegionComponentOptions {
  levelName: string
  regionName: string
  regionSize: number
  origin: IVec3
  size: number
}

export function levelRegion(parent: GameEntity, options: RegionComponentOptions): CreateEntityOptions {
  const min = Vec3.clone(options.origin)
  const max = Vec3.clone(options.origin).addScalar(options.size)

  return {
    name: `Region [${options.regionName}]`,
    parent,
    transform: new TransformComponent({
      world: Mat4.createTranslation(options.origin),
      keepWorld: true,
    }),
    components: [
      new BoundsComponent(),
      new MeshComponent(),
      new SpatialRootComponent({
        instance: OccTree.create({
          min,
          max,
          maxLevel: 5,
          factor: 1.5,
        }),
      }),
      new RegionComponent(options),
    ],
  }
}

export class RegionComponent implements GameComponent {
  private content: ContentService
  private scheduler: SchedulerSystem

  private segments: GameEntity
  private capitals: GameEntity

  private isActive: boolean
  private isVisible: boolean
  private isLoaded: boolean

  public entity: GameEntity
  public levelName: string
  public regionName: string
  public regionSize: number

  private min: IVec3
  private max: IVec3

  public constructor(data: RegionComponentOptions) {
    this.levelName = data.levelName
    this.regionName = data.regionName
    this.regionSize = data.regionSize
    this.min = Vec3.clone(data.origin)
    this.max = Vec3.clone(data.origin).addScalar(data.regionSize)
  }

  public initialize(): void {
    this.scheduler = this.entity.service(SchedulerSystem)
    this.content = this.entity.service(ContentService)
    this.segments = this.entity.world.createEntity({
      name: 'Segments',
      parent: this.entity,
      transform: new TransformComponent({
        lifeCycle: LifeCycleFlags.Propagate,
        keepWorld: true,
      }),
    })
    this.capitals = this.entity.world.createEntity({
      name: 'Capitals',
      parent: this.entity,
      transform: new TransformComponent({
        lifeCycle: LifeCycleFlags.Propagate,
        keepWorld: true,
      }),
    })
  }

  public destroy(): void {
    //
  }

  public activate(): void {
    this.isActive = true
  }

  public deactivate(): void {
    this.isActive = false
    this.segments.deactivate()
  }

  public update(camera: CameraData) {
    const distance = Math.sqrt(boxMat4DistanceSquared(this.min, this.max, camera.world))

    const visibleAt = this.regionSize * 0.5 - SEGMENT_SIZE
    const invisibleAt = this.regionSize * 0.5

    if (this.isVisible && distance >= invisibleAt) {
      this.isVisible = false

      if (this.segments.canDeactivate) {
        this.segments.deactivate()
      }
      if (this.capitals.canDeactivate) {
        this.capitals.deactivate()
      }
    } else if (!this.isVisible && distance <= visibleAt) {
      this.isVisible = true

      if (this.segments.canInitialize) {
        this.segments.initialize()
      }
      if (this.segments.canActivate) {
        this.segments.activate()
      }
      console.assert(this.segments.isActive, 'Segments should be active')

      if (this.capitals.canInitialize) {
        this.capitals.initialize()
      }
      if (this.capitals.canActivate) {
        this.capitals.activate()
      }
    }
    if (this.isVisible && !this.isLoaded) {
      this.isLoaded = true
      this.load()
    }
    for (const child of this.segments.getTransform().children) {
      const segment = child.entity.component(RegionSegmentComponent)
      if (segment.entity.isActive) {
        segment.update(camera)
      }
    }
  }

  private async load() {
    const baseUrl = this.content.nwbtUrl
    const request = getRegionInfoUrl(this.levelName, this.regionName)
    const data = await fetchTypedRequest(baseUrl, request)

    // const entities = await fetchTypedRequest(baseUrl, getRegionEntitiesUrl(this.levelName, this.regionName))
    if (!this.isActive) {
      this.isLoaded = false
      return
    }
    this.createCapitals(data)
    this.createImpostors(data)
  }

  private createCapitals(data: RegionData) {
    for (const layerName in data.capitals) {
      const capitals = data.capitals[layerName]
      if (!capitals?.length) {
        continue
      }

      const layerEntity = this.entity.world.createEntity({
        name: layerName,
        parent: this.capitals,
        transform: new TransformComponent({
          keepWorld: true,
        }),
      })
      for (const capital of capitals) {
        console.assert(!!capital.slice.guid, 'Capital slice reference is missing', capital)

        this.entity.world.createEntity({
          parent: layerEntity,
          transform: new TransformComponent({
            world: Mat4.createFromArray(capital.transform),
            keepWorld: true,
          }),
          components: [
            new SliceSpawnerComponent({
              capitalId: capital.id,
              slice: capital.slice,
            }),
          ],
        })
      }
    }
  }

  private createImpostors(data: RegionData) {
    const count = this.regionSize / SEGMENT_SIZE
    const cells: Array<[number, number]> = []
    for (let y = 0; y < count; y++) {
      for (let x = 0; x < count; x++) {
        cells.push([x, y])
      }
    }

    this.scheduler.schedule({
      lane: PriorityLane.Medium,
      work: () => {
        const [x, y] = cells.pop()
        this.createSegment(x, y, data)
        return cells.length === 0
      },
    })
  }

  private createSegment(x: number, y: number, data: RegionData) {
    const impostors: ImpostorData[] = []
    const segmentMin = Vec3.clone(this.min).addXYZ(x * SEGMENT_SIZE, y * SEGMENT_SIZE, 0)
    const segmentMax = Vec3.clone(segmentMin).addScalar(SEGMENT_SIZE)

    for (const impostor of data.impostors || []) {
      const position = impostor?.position
      if (!position) {
        continue
      }
      const min = Vec3.$0.init(position[0], position[1], 0)
      const max = Vec3.$1.initFrom(Vec3.$0).addScalar(SEGMENT_SIZE)
      if (boxBoxIntersects(segmentMin, segmentMax, min, max)) {
        impostors.push(impostor)
      }
    }
    for (const impostor of data.poiImpostors || []) {
      const position = impostor?.position
      if (!position) {
        continue
      }
      const min = Vec3.$0.init(position[0], position[1], 0)
      const max = Vec3.$1.initFrom(Vec3.$0).addScalar(SEGMENT_SIZE)
      if (boxBoxIntersects(segmentMin, segmentMax, min, max)) {
        impostors.push(impostor)
      }
    }

    const segmentName = `segment ${x} ${y}`
    this.entity.world.createEntity(
      levelSegment(this.segments, {
        name: segmentName,
        level: this.levelName,
        region: this.regionName,
        impostors: impostors,
        origin: segmentMin,
      }),
    )
  }
}
