import {
  BoundsComponent,
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
import { Mat4, Vec3, type IVec3 } from '@gglib/math'
import type { Model } from '@gglib/model'
import { ContentService } from '../../content'
import { DebugLayer, DebugShapeComponent } from '../debug/DebugShapeComponent'

export interface ImpostorComponentOptions {
  name: string
  regionSize: number
  cellSize: number
  origin: IVec3
  model: string
}

export function impostorEntityOptions(parent: GameEntity, options: ImpostorComponentOptions): CreateEntityOptions {
  return {
    parent: parent,
    name: options.name,
    transform: new TransformComponent({
      keepWorld: true,
      world: Mat4.createTranslation(options.origin),
      lifeCycle: LifeCycleFlags.Propagate, // is controlled by RegionSystem
    }),
    components: [
      new DebugShapeComponent({
        type: 'bounds-box',
        layer: DebugLayer.BoundsImpostor,
        color: Color.Red,
      }),
      new SpatialNodeComponent(),
      new BoundsComponent(),
      new ModelComponent(),
      new RegionImpostorComponent(options),
    ],
  }
}
export class RegionImpostorComponent implements GameComponent {
  private content: ContentService
  private scheduler: SchedulerSystem

  public readonly entity: GameEntity
  public readonly min: IVec3
  public readonly max: IVec3
  private modelUrl: string
  private task: ScheduledTask
  private model: Model

  public constructor(data: ImpostorComponentOptions) {
    this.min = data.origin
    this.max = Vec3.copy(data.origin).addXYZ(data.cellSize, data.cellSize, data.regionSize)
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
