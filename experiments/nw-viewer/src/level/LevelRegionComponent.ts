import { type CreateEntityOptions, type GameComponent, type GameEntity } from '@gglib/ecs'
import { fetchTypedRequest, getRegionEntitiesUrl, getRegionInfoUrl, type ImpostorData, type RegionData } from '../api'

import {
  BoundsComponent,
  LifeCyclePropagate,
  MeshComponent,
  OccTree,
  PriorityLane,
  SpatialComponent,
  SpatialRootComponent,
  TransformComponent,
} from '@gglib/components'
import { BasicMaterial, Device } from '@gglib/graphics'

import { BoundingBox, Mat4, Vec3, Vec4 } from '@gglib/math'
import type { CameraData } from '@gglib/render'
import { REGION_VISIBILITY, SEGMENT_SIZE } from '../constants'
import { cryToGltfMat4, gameCoordinate2D, gameToRenderCoordinate, type GameCoordinate2D } from '../math'
import { ContentService } from '../services/content-service'
import {
  levelSegment,
  LevelSegmentComponent,
  type CapitalWithEntities,
  type ChunkWithEntities,
  type EntityInfoWithPosition,
} from './LevelSegmentComponent'

export interface RegionComponentOptions {
  levelName: string
  regionName: string
  regionSize: number
  origin: GameCoordinate2D
  center: GameCoordinate2D
  worldBounds: BoundingBox
}

export function levelRegion(parent: GameEntity, options: RegionComponentOptions): CreateEntityOptions {
  const gMin = options.origin
  const gMax = { X: options.origin.X + options.regionSize, Y: options.origin.Y + options.regionSize }
  const rMin = gameToRenderCoordinate(gMin, 0)
  const rMax = gameToRenderCoordinate(gMax, options.regionSize)
  const min = Vec3.min(rMin, rMax)
  const max = Vec3.max(rMin, rMax)

  return {
    name: `Region [${options.regionName}]`,
    parent,
    transform: new TransformComponent({
      world: Mat4.createTranslation(gameToRenderCoordinate(options.center, 0)),
      keepWorld: true,
    }),
    components: [
      new BoundsComponent(),
      new MeshComponent(),
      new SpatialComponent(),
      new SpatialRootComponent({
        instance: OccTree.create({
          min,
          max,
          maxLevel: 5,
          factor: 1.5,
        }),
      }),
      new LevelRegionComponent(options),
    ],
  }
}

export class LevelRegionComponent implements GameComponent {
  private content: ContentService

  private segments: GameEntity
  private isActive: boolean
  private isVisible: boolean
  private isLoaded: boolean
  private indicator: MeshComponent
  private colorInvisible = new Vec4(0.1, 0.1, 0.1, 1)
  private colorVisible = new Vec4(0.25, 0.25, 0.25, 1)
  private worldBounds: BoundingBox

  public entity: GameEntity
  public center: GameCoordinate2D
  public origin: GameCoordinate2D
  public levelName: string
  public regionName: string
  public regionSize: number

  public constructor(data: RegionComponentOptions) {
    this.levelName = data.levelName
    this.regionName = data.regionName
    this.regionSize = data.regionSize
    this.center = data.center
    this.origin = gameCoordinate2D(data.center.X - 0.5 * data.regionSize, data.center.Y - 0.5 * data.regionSize)
    this.worldBounds = data.worldBounds
  }

  public initialize(): void {
    const device = this.entity.service(Device)
    this.content = this.entity.service(ContentService)
    this.indicator = this.entity.component(MeshComponent)
    this.segments = this.entity.world.createEntity({
      name: 'Segments',
      parent: this.entity,
      transform: new TransformComponent({
        lifeCycle: LifeCyclePropagate,
        keepWorld: true,
      }),
    })

    const material = new BasicMaterial(device)
    material.BaseColor.initFrom(this.colorInvisible)
    // this.indicator.mesh = new Mesh(device, {
    //   materials: [material],
    //   parts: [
    //     planeGeometry(device, {
    //       size: this.regionSize,
    //       tesselation: this.regionSize / SEGMENT_SIZE,
    //       transform: Mat4.createTranslationXYZ(0, -0.02, 0),
    //     }),
    //   ],
    // })
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
    const cx = camera.world.translationX
    const cy = camera.world.translationZ

    const regionSize = this.regionSize
    const visibleAt = regionSize * 0.5 + REGION_VISIBILITY
    const invisibleAt = regionSize * 0.5 + REGION_VISIBILITY + SEGMENT_SIZE
    const dx = Math.abs(-this.center.X - cx)
    const dy = Math.abs(this.center.Y - cy)

    // const material = this.indicator.mesh.materials[0] as BasicMaterial
    if (this.isVisible && (dx >= invisibleAt || dy >= invisibleAt)) {
      this.isVisible = false
      // material.BaseColor.initFrom(this.colorInvisible)

      if (this.segments.canDeactivate) {
        this.segments.deactivate()
      }
    } else if (!this.isVisible && dx <= visibleAt && dy <= visibleAt) {
      this.isVisible = true
      // material.BaseColor.initFrom(this.colorVisible)

      if (this.segments.canInitialize) {
        this.segments.initialize()
      }
      if (this.segments.canActivate) {
        this.segments.activate()
      }
      console.assert(this.segments.isActive, 'Segments should be active')
    }
    if (this.isVisible && !this.isLoaded) {
      this.isLoaded = true
      this.load()
    }
    for (const child of this.segments.getTransform().children) {
      const segment = child.entity.component(LevelSegmentComponent)
      if (segment.entity.isActive) {
        segment.update(camera)
      }
    }
  }

  private async load() {
    const baseUrl = this.content.nwbtUrl
    const request = getRegionInfoUrl(this.levelName, this.regionName)
    const data = await fetchTypedRequest(baseUrl, request)
    const entities = await fetchTypedRequest(baseUrl, getRegionEntitiesUrl(this.levelName, this.regionName))
    if (!this.isActive) {
      this.isLoaded = false
      return
    }

    const capitals: CapitalWithEntities[] = []
    const chunks: ChunkWithEntities[] = []
    const items: EntityInfoWithPosition[] = []

    for (const layer of data.capitals || []) {
      for (const capital of layer.capitals || []) {
        const capEntities = entities?.[layer.name]?.[capital.id] || []
        if (capEntities.length === 0) {
          continue
        }
        // capitals.push({
        //   ...capital,
        //   matrix: Matrix.FromArray(cryToGltfMat4(capital.transform)),
        //   entities: capEntities,
        // })
        for (const item of capEntities) {
          items.push({
            ...item,
            matrix: Mat4.createFromArray(cryToGltfMat4(item.transform)),
          })
        }
      }

      for (const chunk of layer.chunks || []) {
        const capEntities = entities?.[layer.name]?.[chunk.id] || []
        if (capEntities.length === 0) {
          continue
        }
        // chunks.push({
        //   ...chunk,
        //   matrix: Matrix.FromArray(cryToGltfMat4(chunk.transform)),
        //   entities: capEntities,
        // })

        for (const item of capEntities) {
          items.push({
            ...item,
            matrix: Mat4.createFromArray(cryToGltfMat4(item.transform)),
          })
        }
      }
    }

    const count = this.regionSize / SEGMENT_SIZE
    const cells: Array<[number, number]> = []
    for (let y = 0; y < count; y++) {
      for (let x = 0; x < count; x++) {
        cells.push([x, y])
        //this.createSegment(x, y, data, capitals, chunks, items)
      }
    }

    this.content.scheduler.schedule({
      lane: PriorityLane.Medium,
      work: () => {
        const [x, y] = cells.pop()
        this.createSegment(x, y, data, capitals, chunks, items)
        return cells.length === 0
      },
    })
  }

  private createSegment(
    x: number,
    y: number,
    data: RegionData,
    capitalsTx: CapitalWithEntities[],
    chunksTx: ChunkWithEntities[],
    itemsTx: EntityInfoWithPosition[],
  ) {
    const impostors: ImpostorData[] = []
    const capitals: CapitalWithEntities[] = []
    const chunks: ChunkWithEntities[] = []
    const entities: EntityInfoWithPosition[] = []

    const originX = this.origin.X + x * SEGMENT_SIZE
    const originY = this.origin.Y + y * SEGMENT_SIZE

    for (const impostor of data.impostors || []) {
      const position = impostor?.position
      if (!position) {
        continue
      }
      if (position[0] < originX || position[0] >= originX + SEGMENT_SIZE) {
        continue
      }
      if (position[1] < originY || position[1] >= originY + SEGMENT_SIZE) {
        continue
      }
      impostors.push(impostor)
    }

    for (const impostor of data.poiImpostors || []) {
      const position = impostor?.position
      if (!position) {
        continue
      }
      if (position[0] < originX || position[0] >= originX + SEGMENT_SIZE) {
        continue
      }
      if (position[1] < originY || position[1] >= originY + SEGMENT_SIZE) {
        continue
      }
      impostors.push(impostor)
    }
    const position = new Vec3()

    // for (const capital of capitalsTx || []) {
    //   capital.matrix.getTranslationToRef(position)
    //   if (position.x < originX || position.x >= originX + SEGMENT_SIZE) {
    //     continue
    //   }
    //   if (position.z < originY || position.z >= originY + SEGMENT_SIZE) {
    //     continue
    //   }
    //   capitals.push(capital)
    // }
    // for (const chunk of chunksTx || []) {
    //   chunk.matrix.getTranslationToRef(position)
    //   if (position.x < originX || position.x >= originX + SEGMENT_SIZE) {
    //     continue
    //   }
    //   if (position.z < originY || position.z >= originY + SEGMENT_SIZE) {
    //     continue
    //   }
    //   chunks.push(chunk)
    // }

    for (const item of itemsTx || []) {
      item.matrix.getTranslation(position)
      const x = -position.x
      const y = position.z
      if (x < originX || x >= originX + SEGMENT_SIZE) {
        continue
      }
      if (y < originY || y >= originY + SEGMENT_SIZE) {
        continue
      }
      if (this.worldBounds && !this.worldBounds.intersectsPoint(position)) {
        continue
      }
      entities.push(item)
    }
    const centerX = originX + 0.5 * SEGMENT_SIZE
    const centerY = originY + 0.5 * SEGMENT_SIZE

    const segmentName = `segment ${x} ${y}`
    this.entity.world.createEntity(
      levelSegment(this.segments, {
        name: segmentName,
        level: this.levelName,
        region: this.regionName,
        impostors: impostors,
        capitals: capitals,
        chunks: chunks,
        entities: entities,
        center: gameCoordinate2D(centerX, centerY),
      }),
    )
  }
}
