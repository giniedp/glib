import {
  BoundsComponent,
  ModelComponent,
  PriorityLane,
  SchedulerSystem,
  SpatialComponent,
  TransformComponent,
  type ScheduledTask,
} from '@gglib/components'
import type { CreateEntityOptions, GameComponent, GameEntity } from '@gglib/ecs'
import { Mat4 } from '@gglib/math'
import type { ImpostorData } from '../../api'
import { ContentService } from '../../content'

export function levelImpostor(parent: GameEntity, data: ImpostorData): CreateEntityOptions {
  return {
    name: data.model,
    parent,
    transform: new TransformComponent({
      world: Mat4.createTranslationXYZ(-data.position[0], 0, data.position[1]),
      keepWorld: true,
    }),
    components: [new ModelComponent(), new BoundsComponent(), new ImpostorComponent(data), new SpatialComponent()],
  }
}

export class ImpostorComponent implements GameComponent {
  private modelComponent: ModelComponent
  private content: ContentService
  private scheduler: SchedulerSystem
  private data: ImpostorData

  public constructor(data: ImpostorData) {
    this.data = data
  }

  public readonly entity: GameEntity
  private loadTask: ScheduledTask
  private isLoaded: boolean = false

  public initialize(): void {
    this.modelComponent = this.entity.component(ModelComponent)
    this.content = this.entity.service(ContentService)
    this.scheduler = this.entity.service(SchedulerSystem)
  }

  public activate(): void {
    if (this.isLoaded || this.loadTask) {
      return
    }

    const task = this.scheduler.schedule({
      entity: this.entity,
      lane: PriorityLane.Medium,
      load: async () => {
        this.modelComponent.model = await this.content.loadModel(this.data.model, null)
        this.isLoaded = true
      },
      onDone: () => {
        if (this.loadTask === task) {
          this.loadTask = null
        }
      },
      onCancel: () => {
        if (this.loadTask === task) {
          this.loadTask = null
        }
      },
    })
    this.loadTask = task
  }

  public deactivate(): void {
    if (this.loadTask) {
      this.loadTask.cancelled = true
      this.loadTask = null
    }
  }

  public destroy(): void {
    //
  }
}
