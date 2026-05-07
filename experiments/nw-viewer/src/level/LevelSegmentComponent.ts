import type { CapitalData, ChunkData, EntityData, ImpostorData } from '../api'

import {
  BoundsComponent,
  LifeCyclePropagate,
  MeshComponent,
  SpatialComponent,
  TransformComponent,
} from '@gglib/components'
import { GameEntity, type CreateEntityOptions, type GameComponent } from '@gglib/ecs'
import { BasicMaterial, createVertexLayout, Device, Mesh, planeGeometry } from '@gglib/graphics'

import { Mat4, Vec3, Vec4 } from '@gglib/math'
import type { CameraData } from '@gglib/render'
import { gameToRenderCoordinate, type GameCoordinate2D } from '../math'
import { ENABLE_IMPOSTORS, LOD_SPANS, lodSpanEnd, lodSpanStart, lodSpanVisibleEnd, SEGMENT_SIZE } from '../constants'
import { levelImpostor } from './LevelImpostorComponent'

const IMPOSTOR_SHOW_AT = Math.pow(lodSpanStart(LOD_SPANS.impostor), 2)
const IMPOSTOR_HIDE_AT = Math.pow(lodSpanVisibleEnd(LOD_SPANS.impostor), 2)
const IMPOSTOR_UNLOAD_AT = Math.pow(lodSpanEnd(LOD_SPANS.impostor), 2)

const POI_SHOW_AT = Math.pow(lodSpanStart(LOD_SPANS.impostorPoi), 2)
const POI_HIDE_AT = Math.pow(lodSpanVisibleEnd(LOD_SPANS.impostorPoi), 2)
const POI_UNLOAD_AT = Math.pow(lodSpanEnd(LOD_SPANS.impostorPoi), 2)

const CAPITAL_SHOW_AT = Math.pow(lodSpanStart(LOD_SPANS.capital), 2)
const CAPITAL_HIDE_AT = Math.pow(lodSpanVisibleEnd(LOD_SPANS.capital), 2)
const CAPITAL_UNLOAD_AT = Math.pow(lodSpanEnd(LOD_SPANS.capital), 2)

export type CapitalWithEntities = CapitalData & {
  matrix: Mat4
  entities: EntityData[]
}

export type ChunkWithEntities = ChunkData & {
  matrix: Mat4
  entities: EntityData[]
}

export type EntityInfoWithPosition = EntityData & {
  matrix: Mat4
}

export interface SegmentComponentOptions {
  name: string
  level: string
  region: string
  center: GameCoordinate2D
  impostors: ImpostorData[]
  capitals: CapitalWithEntities[]
  chunks: ChunkWithEntities[]
  entities: EntityInfoWithPosition[]
  distribution?: EntityData[]
}

export function levelSegment(parent: GameEntity, options: SegmentComponentOptions): CreateEntityOptions {
  return {
    name: options.name,
    parent,
    transform: new TransformComponent({
      world: Mat4.createTranslation(gameToRenderCoordinate(options.center, 0)),
      keepWorld: true,
    }),
    components: [
      new BoundsComponent(),
      new MeshComponent(),
      new SpatialComponent(),
      new LevelSegmentComponent(options),
    ],
  }
}

const colTmp = new Vec3()
export class LevelSegmentComponent implements GameComponent {
  private capitals: GameEntity
  private capitalsLoaded: boolean = false
  private capitalsShown: boolean = false

  private impostors: GameEntity
  private impostorsLoaded: boolean = false
  private impostorsShown: boolean = false

  private poiImpostors: GameEntity
  private poiImpostorsLoaded: boolean = false
  private poiImpostorsShown: boolean = false

  private indicator: MeshComponent
  private color = new Vec4(0.25, 0.15, 0.15, 1)
  private alpha = 0.1

  private data: SegmentComponentOptions

  public entity: GameEntity
  public level: string
  public region: string
  public center: GameCoordinate2D

  public constructor(data: SegmentComponentOptions) {
    this.level = data.level
    this.region = data.region
    this.center = data.center
    this.data = data
  }

  public initialize(): void {
    const device = this.entity.service(Device)

    const material = new BasicMaterial(device)

    this.indicator = this.entity.component(MeshComponent)
    this.indicator.mesh = new Mesh(device, {
      materials: [material],
      parts: [
        planeGeometry(device, {
          layout: [createVertexLayout(['position', 'texture', 'normal', 'color'])],
          size: SEGMENT_SIZE - 1,
          transform: Mat4.createTranslationXYZ(0, -0.01, 0),
        }),
      ],
    })

    this.capitals = this.entity.world.createEntity({
      name: `capitals`,
      parent: this.entity,
      transform: new TransformComponent({
        world: Mat4.createIdentity(),
        keepWorld: true,
      }),
    })

    this.impostors = this.entity.world.createEntity({
      name: `impostors`,
      parent: this.entity,
      transform: new TransformComponent({
        lifeCycle: LifeCyclePropagate,
        world: Mat4.createIdentity(),
        keepWorld: true,
      }),
    })

    this.poiImpostors = this.entity.world.createEntity({
      name: `poiImpostors`,
      parent: this.entity,
      transform: new TransformComponent({
        lifeCycle: LifeCyclePropagate,
        world: Mat4.createIdentity(),
        keepWorld: true,
      }),
    })

    this.createImpostors(this.data.impostors)
    this.createCapitals(this.data.capitals)
    this.createChunks(this.data.chunks)
    this.createEntities(this.data.entities)

    if (this.data.entities?.length) {
      this.color.x = 0.5
      this.color.x = 0.5
    }
    if (this.impostors.getTransform().children.length > 0) {
      this.color.y = 0.5
      this.color.y = 0.5
    }
    if (this.data.capitals?.length) {
      this.color.z = 0.5
      this.color.z = 0.5
    }
    material.BaseColor.initFrom(this.color)
  }

  public activate(): void {
    //
  }

  public deactivate(): void {
    this.impostorsLoaded = false
    this.impostorsShown = false
    this.capitalsLoaded = false
    this.capitalsShown = false
    this.poiImpostorsLoaded = false
    this.poiImpostorsShown = false
    if (this.impostors.canDeactivate) {
      this.impostors.deactivate()
    }
    if (this.poiImpostors.canDeactivate) {
      this.poiImpostors.deactivate()
    }
    if (this.capitals.canDeactivate) {
      this.capitals.deactivate()
    }
  }

  public destroy(): void {
    //
  }

  public update(camera: CameraData) {
    const cx = camera.world.translationX
    const cy = camera.world.translationZ
    const dx = Math.abs(-this.center.X - cx)
    const dy = Math.abs(this.center.Y - cy)
    const d2 = dx * dx + dy * dy

    const segmentUnloadAt = Math.pow(Math.max(IMPOSTOR_UNLOAD_AT, POI_UNLOAD_AT, CAPITAL_UNLOAD_AT), 2)

    const segmentShouldLoad = d2 <= segmentUnloadAt

    const impostorShouldLoad = d2 <= IMPOSTOR_UNLOAD_AT
    const impostorShouldShow = IMPOSTOR_SHOW_AT <= d2 && d2 <= IMPOSTOR_HIDE_AT

    const poiImpostorShouldLoad = d2 <= POI_UNLOAD_AT
    const poiImpostorShouldShow = POI_SHOW_AT <= d2 && d2 <= POI_HIDE_AT

    const capitalShouldLoad = d2 <= CAPITAL_UNLOAD_AT
    const capitalShouldShow = CAPITAL_SHOW_AT <= d2 && d2 <= CAPITAL_HIDE_AT

    let alpha = this.alpha

    if (!segmentShouldLoad) {
      this.impostorsLoaded = false
      this.impostorsShown = false
      this.capitalsLoaded = false
      this.capitalsShown = false
      this.poiImpostorsLoaded = false
      this.poiImpostorsShown = false
      if (this.impostors.canDeactivate) {
        this.impostors.deactivate()
      }
      if (this.poiImpostors.canDeactivate) {
        this.poiImpostors.deactivate()
      }
      if (this.capitals.canDeactivate) {
        this.capitals.deactivate()
      }
    }

    //
    // IMPOSTORS
    //
    if (!this.impostorsLoaded && impostorShouldLoad) {
      this.impostorsLoaded = true
      if (this.impostors.canInitialize) {
        this.impostors.initialize()
      }
    }
    if (!this.impostorsShown && impostorShouldShow) {
      this.impostorsShown = true
      if (this.impostors.canActivate) {
        this.impostors.activate()
      }
      console.assert(this.impostors.isActive, 'Impostors should be active')
    }
    if (this.impostorsShown && !impostorShouldShow) {
      this.impostorsShown = false
      if (this.impostors.canDeactivate) {
        this.impostors.deactivate()
      }
      console.assert(!this.impostors.isActive, 'Impostors should be inactive')
    }

    //
    // POI IMPOSTORS
    //
    if (!this.poiImpostorsLoaded && poiImpostorShouldLoad) {
      this.poiImpostorsLoaded = true
      if (this.poiImpostors.canInitialize) {
        this.poiImpostors.initialize()
      }
    }
    if (!this.poiImpostorsShown && poiImpostorShouldShow) {
      this.poiImpostorsShown = true
      if (this.poiImpostors.canActivate) {
        this.poiImpostors.activate()
      }
      console.assert(this.poiImpostors.isActive, 'Impostors should be active')
    }
    if (this.poiImpostorsShown && !poiImpostorShouldShow) {
      this.poiImpostorsShown = false
      if (this.poiImpostors.canDeactivate) {
        this.poiImpostors.deactivate()
      }
      console.assert(!this.poiImpostors.isActive, 'Impostors should be inactive')
    }

    //
    // CAPITALS
    //
    if (!this.capitalsLoaded && capitalShouldLoad) {
      this.capitalsLoaded = true
      if (this.capitals.canInitialize) {
        this.capitals.initialize()
      }
      // if (this.capitals.canActivate) {
      //   this.capitals.activate()
      // }
      // console.assert(this.capitals.isActive, 'Capitals should be active')
    }
    if (!this.capitalsShown && capitalShouldShow) {
      this.capitalsShown = true
      // this.scene.add(this.capitalsLayer)
    }
    if (this.capitalsShown && !capitalShouldShow) {
      this.capitalsShown = false
      // this.scene.remove(this.capitalsLayer)
    }

    if (!this.capitalsLoaded && !this.impostorsLoaded) {
      alpha = 0.2
    }
    if (!this.capitalsLoaded && this.impostorsLoaded) {
      alpha = 0.4
    }
    if (this.impostorsShown) {
      alpha = 0.6
    }
    if (this.capitalsLoaded) {
      alpha = 0.8
    }
    if (this.capitalsShown) {
      alpha = 1.0
    }
    if (alpha != this.alpha) {
      colTmp.init(this.color.x, this.color.y, this.color.z)
      if (alpha == 0.2) {
        const gray = getGrayscale(colTmp.x, colTmp.y, colTmp.z)
        colTmp.init(gray, gray, gray)
      } else {
        colTmp.multiplyScalar(alpha)
      }
      this.alpha = alpha

      if (this.indicator.mesh) {
        const material = this.indicator.mesh.materials[0] as BasicMaterial
        material.Alpha = alpha
      }
    }
  }

  private createImpostors(impostor: ImpostorData[]) {
    if (!impostor?.length) {
      return
    }
    for (const item of impostor) {
      if (!ENABLE_IMPOSTORS || !item.model) {
        continue
      }
      if (item.model.includes('poi')) {
        this.entity.world.createEntity(levelImpostor(this.poiImpostors, item))
      } else {
        this.entity.world.createEntity(levelImpostor(this.impostors, item))
      }
    }
  }

  private createCapitals(items: Array<CapitalWithEntities | ChunkWithEntities>) {
    if (!items?.length) {
      return
    }
    for (const item of items) {
      this.createCapital(item, `capital ${item.id}`)
    }
  }

  private createChunks(items: Array<CapitalWithEntities | ChunkWithEntities>) {
    if (!items?.length) {
      return
    }
    for (const item of items) {
      this.createCapital(item, `chunk ${item.id}`)
    }
  }

  private createCapital(capital: CapitalWithEntities | ChunkWithEntities, entityName: string) {
    console.log('createCapital', { capital, entityName })
    // this.capitals.create(entityName).addComponents(
    //   new TransformComponent({
    //     transform: createChildTransform(this.capitalsLayer, entityName, {
    //       matrix: capital.matrix,
    //     }),
    //   }),
    //   new CapitalComponent(capital),
    // )
    // if (ENABLE_CAPITAL_INDICATOR) {
    //   let size = 1
    //   let color = new Color4(1, 0.5, 1, 1)
    //   let shape: 'sphere' | 'box' = 'sphere'
    //   if ('radius' in capital) {
    //     size = capital.radius || 1
    //   }
    //   if ('size' in capital) {
    //     size = capital.size || 1
    //     shape = 'box'
    //   }
    //   this.capitalIndicators.create().addComponents(
    //     new TransformComponent({
    //       transform: createChildTransform(this.capitalsLayer, entityName, {
    //         matrix: capital.matrix,
    //       }),
    //     }),
    //     new DebugMeshComponent({
    //       name: entityName,
    //       type: shape,
    //       size: size,
    //       color: color,
    //     }),
    //   )
    // }
  }

  private createEntities(entities: EntityInfoWithPosition[]) {
    if (!entities?.length) {
      return
    }
    // instantiateObjects(entities, this.capitals)
  }
}

function getGrayscale(r: number, g: number, b: number) {
  return r * 0.3 + g * 0.59 + b * 0.11
}
