import {
  BoundsComponent,
  EcsGame,
  LifeCycleFlags,
  ModelComponent,
  PriorityLane,
  SchedulerSystem,
  SpatialNodeComponent,
  TransformComponent,
  type ScheduledTask,
} from '@gglib/components'
import { GameEntity, type CreateEntityOptions, type GameComponent } from '@gglib/ecs'

import { Color } from '@gglib/graphics'
import { boxMat4DistanceSquared, mat4CreateTranslation, vec3AddScalars, type IVec3 } from '@gglib/math'
import type { Model } from '@gglib/model'
import {
  IMPOSTOR_FADE_RANGE,
  LOD_SPANS,
  lodSpanStart,
  lodSpanVisibleEnd,
  POI_IMPOSTOR_FADE_LENGTH,
  type LodSpan,
} from '../../constants'
import { ContentService } from '../../content'
import { DebugLayer, DebugShapeComponent } from '../debug/DebugShapeComponent'

export interface ImpostorComponentOptions {
  name: string
  regionSize: number
  cellSize: number
  origin: IVec3
  model: string
  /**
   * Distance span in which the impostor is visible
   */
  span: LodSpan
}

export function impostorEntityOptions(parent: GameEntity, options: ImpostorComponentOptions): CreateEntityOptions {
  const isPoi = options.span === LOD_SPANS.impostorPoi
  const impostor = new RegionImpostorComponent(options)
  const debug = new DebugShapeComponent({
    type: 'bounds-box',
    layer: isPoi ? DebugLayer.Impostor_POI : DebugLayer.Impostor,
    color: isPoi ? Color.Orange : Color.Lime,
  })
  const cameraWorld = () => debug.entity.world.getSystem(EcsGame).scene.getView(0).camera.world
  debug
    .addInfo('kind', () => (isPoi ? 'poi' : 'vegetation'))
    .addInfo('model', () => options.model)
    .addInfo('show at', () => lodSpanStart(options.span))
    .addInfo('hide at', () => lodSpanVisibleEnd(options.span))
    .addInfo('fade', () =>
      isPoi
        ? `in ${lodSpanStart(options.span)} -> ${lodSpanStart(options.span) + POI_IMPOSTOR_FADE_LENGTH}`
        : `in ${lodSpanStart(options.span) - IMPOSTOR_FADE_RANGE} -> ${lodSpanStart(options.span)}`,
    )
    .addInfo('box distance', () =>
      Math.sqrt(boxMat4DistanceSquared(impostor.min, impostor.max, cameraWorld())).toFixed(1),
    )
    .addInfo('state', () => debug.entity.stateName)
  return {
    parent: parent,
    name: options.name,
    transform: new TransformComponent({
      keepWorld: true,
      world: mat4CreateTranslation(options.origin),
      lifeCycle: LifeCycleFlags.Propagate, // is controlled by RegionSystem
    }),
    components: [debug, new SpatialNodeComponent(), new BoundsComponent(), new ModelComponent(), impostor],
  }
}
export class RegionImpostorComponent implements GameComponent {
  private content: ContentService
  private scheduler: SchedulerSystem

  public readonly entity: GameEntity
  public readonly min: IVec3
  public readonly max: IVec3
  public readonly span: LodSpan
  private modelUrl: string
  private task: ScheduledTask
  private model: Model

  public constructor(data: ImpostorComponentOptions) {
    // impostor origin is the cell center
    this.span = data.span
    const half = data.cellSize * 0.5
    this.min = vec3AddScalars(data.origin, -half, -half, 0)
    this.max = vec3AddScalars(data.origin, half, half, data.regionSize)
    this.modelUrl = data.model
  }

  public initialize(): void {
    this.content = this.entity.service(ContentService)
    this.scheduler = this.entity.service(SchedulerSystem)
  }

  public activate(): void {
    if (this.task || this.model) {
      return
    }
    this.task = this.scheduler.schedule<Model>({
      lane: PriorityLane.High,
      entity: this.entity,
      label: this.modelUrl,
      context: null,
      load: async (task) => {
        task.context = await this.content.loadModel(this.modelUrl, null)
      },
      work: (task) => {
        this.model = task.context
        this.entity.component(ModelComponent).model = this.model
        return true
      },
      finalize: (task, err) => {
        if (this.task === task) {
          this.task = null
        }
      },
    })
  }

  public deactivate(): void {
    if (this.task) {
      this.task.cancelled = true
      this.task = null
    }
  }

  public destroy(): void {
    if (this.task) {
      this.task.cancelled = true
      this.task = null
    }
  }
}
