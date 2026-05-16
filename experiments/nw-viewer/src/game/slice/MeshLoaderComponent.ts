import {
  BoundsComponent,
  ModelComponent,
  PriorityLane,
  SchedulerSystem,
  SpatialComponent,
  type ScheduledTask,
} from '@gglib/components'
import type { GameComponent, GameEntity } from '@gglib/ecs'
import { Color } from '@gglib/graphics'
import { Vec4 } from '@gglib/math'
import type { ViewerMeshComponent } from '../../api'
import { SEGMENT_SIZE } from '../../constants'
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
    this.debug = this.entity.component(DebugShapeComponent)
    this.debug.type = 'sphere'

    this.content = this.entity.service(ContentService)
    this.scheduler = this.entity.service(SchedulerSystem)
    this.modelComponent = this.entity.getOrCreateComponent(ModelComponent, () => {
      return new ModelComponent()
    })
    this.entity.getOrCreateComponent(BoundsComponent, () => new BoundsComponent())
    this.entity.getOrCreateComponent(SpatialComponent, () => new SpatialComponent())

    if (this.data.shouldInstance) {
      this.debug.color = Vec4.createFrom(Color.Yellow)
    }
    if (this.data.maxViewDistance < SEGMENT_SIZE * 2) {
      this.debug.color = Vec4.createFrom(Color.Blue)
    }
    if (this.data.forceMerge) {
      this.debug.color = Vec4.createFrom(Color.LimeGreen)
    }
    this.debug.scale.x = this.data.maxViewDistance
    this.debug.scale.y = this.data.maxViewDistance
    this.debug.scale.z = this.data.maxViewDistance
  }

  public destroy(): void {
    //
  }

  public activate(): void {
    this.debug.color = Color.Green
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
        if (this.data.shouldInstance) {
          console.log('should instance', this.data.mesh)
        }
        if (this.data.shouldMerge) {
          console.log('should merge', this.data.mesh)
        }
        this.modelComponent.model = await this.content.loadModel(this.data.mesh, this.data.material)
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
    this.debug.color = Color.Red
  }
}
