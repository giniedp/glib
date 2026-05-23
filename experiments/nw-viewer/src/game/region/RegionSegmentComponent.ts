import type { CapitalData, ChunkData, EntityData, ImpostorData } from '../../api'

import { LifeCyclePropagate, TransformComponent } from '@gglib/components'
import { GameEntity, type CreateEntityOptions, type GameComponent } from '@gglib/ecs'

import { Mat4, Vec4, type IVec3 } from '@gglib/math'
import type { CameraData } from '@gglib/render'
import { ENABLE_IMPOSTORS, LOD_SPANS, lodSpanEnd, lodSpanStart, lodSpanVisibleEnd, SEGMENT_SIZE } from '../../constants'
import { DebugShapeComponent } from '../debug/DebugShapeComponent'
import { levelImpostor } from '../region/ImpostorComponent'

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
  origin: IVec3
  impostors: ImpostorData[]
}

export function levelSegment(parent: GameEntity, options: SegmentComponentOptions): CreateEntityOptions {
  return {
    name: options.name,
    parent,
    transform: new TransformComponent({
      world: Mat4.createTranslation(options.origin),
      keepWorld: true,
    }),
    components: [new RegionSegmentComponent(options)],
  }
}

export class RegionSegmentComponent implements GameComponent {
  private capitals: GameEntity
  private capitalsLoaded: boolean = false
  private capitalsShown: boolean = false

  private impostors: GameEntity
  private impostorsLoaded: boolean = false
  private impostorsShown: boolean = false

  private poiImpostors: GameEntity
  private poiImpostorsLoaded: boolean = false
  private poiImpostorsShown: boolean = false

  private shape: DebugShapeComponent
  private color = new Vec4(0.25, 0.15, 0.15, 1)

  private data: SegmentComponentOptions

  public entity: GameEntity
  public level: string
  public region: string
  public origin: IVec3
  public center: IVec3

  public constructor(data: SegmentComponentOptions) {
    this.level = data.level
    this.region = data.region
    this.origin = data.origin
    this.center = {
      x: data.origin.x + SEGMENT_SIZE / 2,
      y: data.origin.y + SEGMENT_SIZE / 2,
      z: data.origin.z,
    }
    this.data = data
  }

  public initialize(): void {
    this.shape = this.entity.getOrCreateComponent(DebugShapeComponent, () => {
      return new DebugShapeComponent({ type: 'plane', solid: true })
    })
    this.shape.scale = { x: SEGMENT_SIZE - 1, y: 1, z: SEGMENT_SIZE - 1, w: 0 }
    this.shape.color = this.color

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
    const cy = camera.world.translationY
    const dx = Math.abs(this.center.x - cx)
    const dy = Math.abs(this.center.y - cy)
    const d2 = dx * dx + dy * dy

    const segmentUnloadAt = Math.pow(Math.max(IMPOSTOR_UNLOAD_AT, POI_UNLOAD_AT, CAPITAL_UNLOAD_AT), 2)

    const segmentShouldLoad = d2 <= segmentUnloadAt

    const impostorShouldLoad = d2 <= IMPOSTOR_UNLOAD_AT
    const impostorShouldShow = IMPOSTOR_SHOW_AT <= d2 && d2 <= IMPOSTOR_HIDE_AT

    const poiImpostorShouldLoad = d2 <= POI_UNLOAD_AT
    const poiImpostorShouldShow = POI_SHOW_AT <= d2 && d2 <= POI_HIDE_AT

    const capitalShouldLoad = d2 <= CAPITAL_UNLOAD_AT
    const capitalShouldShow = CAPITAL_SHOW_AT <= d2 && d2 <= CAPITAL_HIDE_AT

    let alpha = this.color.w

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
    this.color.w = alpha
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
}
