import { type CreateEntityOptions, type GameComponent, type GameEntity } from '@gglib/ecs'
import { fetchTypedRequest, getRegionInfoUrl, type RegionData } from '../../api'

import {
  BoundsComponent,
  LifeCyclePropagate,
  MeshComponent,
  OccTree,
  PriorityLane,
  SchedulerSystem,
  SpatialRootComponent,
  TransformComponent,
} from '@gglib/components'
import { Device } from '@gglib/graphics'

import { Mat4, Vec3, type IVec3 } from '@gglib/math'
import type { CameraData } from '@gglib/render'
import { SEGMENT_SIZE } from '../../constants'
import { ContentService } from '../../content'
import { SliceSpawnerComponent } from '../slice/SliceSpawnerComponent'
import { RegionSegmentComponent } from './RegionSegmentComponent'

export interface RegionComponentOptions {
  levelName: string
  regionName: string
  regionSize: number
  origin: IVec3
  size: number
}

export function levelRegion(parent: GameEntity, options: RegionComponentOptions): CreateEntityOptions {
  const min = Vec3.createFrom(options.origin)
  const max = Vec3.createFrom(options.origin)
  max.x += options.size
  max.y += options.size
  max.z += options.size

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
  public center: IVec3
  public origin: IVec3
  public levelName: string
  public regionName: string
  public regionSize: number

  public constructor(data: RegionComponentOptions) {
    this.levelName = data.levelName
    this.regionName = data.regionName
    this.regionSize = data.regionSize
    this.origin = Vec3.createFrom(data.origin)
    this.center = Vec3.createFrom(data.origin)
    this.center.x += data.regionSize * 0.5
    this.center.y += data.regionSize * 0.5
  }

  public initialize(): void {
    const device = this.entity.service(Device)

    this.scheduler = this.entity.service(SchedulerSystem)
    this.content = this.entity.service(ContentService)
    this.segments = this.entity.world.createEntity({
      name: 'Segments',
      parent: this.entity,
      transform: new TransformComponent({
        lifeCycle: LifeCyclePropagate,
        keepWorld: true,
      }),
    })
    this.capitals = this.entity.world.createEntity({
      name: 'Capitals',
      parent: this.entity,
      transform: new TransformComponent({
        lifeCycle: LifeCyclePropagate,
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
    const px = camera.world.translationX
    const py = camera.world.translationZ

    const regionSize = this.regionSize
    const minX = -this.center.y - regionSize * 0.5
    const maxX = -this.center.y + regionSize * 0.5
    const minY = this.center.y - regionSize * 0.5
    const maxY = this.center.y + regionSize * 0.5

    const dx = Math.max(minX - px, 0, px - maxX)
    const dy = Math.max(minY - py, 0, py - maxY)
    const distance = Math.sqrt(dx * dx + dy * dy)

    const visibleAt = regionSize * 0.5 - SEGMENT_SIZE
    const invisibleAt = regionSize * 0.5

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
    // const impostors: ImpostorData[] = []
    // const originX = this.origin.X + x * SEGMENT_SIZE
    // const originY = this.origin.Y + y * SEGMENT_SIZE
    // for (const impostor of data.impostors || []) {
    //   const position = impostor?.position
    //   if (!position) {
    //     continue
    //   }
    //   if (position[0] < originX || position[0] >= originX + SEGMENT_SIZE) {
    //     continue
    //   }
    //   if (position[1] < originY || position[1] >= originY + SEGMENT_SIZE) {
    //     continue
    //   }
    //   impostors.push(impostor)
    // }
    // for (const impostor of data.poiImpostors || []) {
    //   const position = impostor?.position
    //   if (!position) {
    //     continue
    //   }
    //   if (position[0] < originX || position[0] >= originX + SEGMENT_SIZE) {
    //     continue
    //   }
    //   if (position[1] < originY || position[1] >= originY + SEGMENT_SIZE) {
    //     continue
    //   }
    //   impostors.push(impostor)
    // }
    // const centerX = originX + 0.5 * SEGMENT_SIZE
    // const centerY = originY + 0.5 * SEGMENT_SIZE
    // const segmentName = `segment ${x} ${y}`
    // this.entity.world.createEntity(
    //   levelSegment(this.segments, {
    //     name: segmentName,
    //     level: this.levelName,
    //     region: this.regionName,
    //     impostors: impostors,
    //     center: gameCoordinate2D(centerX, centerY),
    //   }),
    // )
  }
}
