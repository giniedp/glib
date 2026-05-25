import {
  BoundsComponent,
  ModelComponent,
  PriorityLane,
  SchedulerSystem,
  SpatialComponent,
  type ScheduledTask,
} from '@gglib/components'
import type { GameComponent, GameEntity } from '@gglib/ecs'
import type { ViewerMeshComponent } from '../../api'
import { ContentService } from '../../content'
import { DebugShapeComponent } from '../debug/DebugShapeComponent'

export class MeshLoaderComponent implements GameComponent {
  public readonly entity: GameEntity
  public readonly data: ViewerMeshComponent

  private content: ContentService
  private scheduler: SchedulerSystem
  private modelComponent: ModelComponent
  private isLoaded: boolean = false
  private task: ScheduledTask

  private debug: DebugShapeComponent

  public constructor(data: ViewerMeshComponent) {
    this.data = data
  }

  public initialize(): void {
    // this.debug = this.entity.getOrCreateComponent(DebugShapeComponent, () => {
    //   return new DebugShapeComponent({
    //     type: 'box',
    //     solid: false,
    //   })
    // })

    this.content = this.entity.service(ContentService)
    this.scheduler = this.entity.service(SchedulerSystem)
    this.modelComponent = this.entity.getOrCreateComponent(ModelComponent, () => {
      return new ModelComponent()
    })
    this.entity.getOrCreateComponent(BoundsComponent, () => new BoundsComponent())
    this.entity.getOrCreateComponent(SpatialComponent, () => new SpatialComponent())
  }

  public destroy(): void {
    //
  }

  public activate(): void {
    // this.debug.color = Color.Green
    if (this.task || this.isLoaded) {
      return
    }
    const task = this.scheduler.schedule({
      entity: this.entity,
      lane: PriorityLane.Low,
      load: async () => {
        if (this.data.instances?.length) {
          console.log(this.data.instances)
        }

        this.modelComponent.model = await this.content.loadModel(this.data.mesh, this.data.material)
        if (this.debug) {
          const bounds = this.modelComponent.model.boundingBox
          this.debug.scale.x = bounds.max.x - bounds.min.x
          this.debug.scale.y = bounds.max.y - bounds.min.y
          this.debug.scale.z = bounds.max.z - bounds.min.z
        }
        this.isLoaded = true
      },
      onDone: () => {
        if (this.task === task) {
          this.task = null
        }
      },
      onCancel: () => {
        if (this.task === task) {
          this.task = null
        }
      },
    })
    this.task = task
  }

  public deactivate(): void {
    // this.debug.color = Color.Red
  }
}
