import { BoundsComponent, ModelComponent, SpatialComponent, TransformComponent } from '@gglib/components'
import type { CreateEntityOptions, GameComponent, GameEntity } from '@gglib/ecs'
import { Mat4 } from '@gglib/math'
import type { ImpostorData } from '../api'
import { ContentService } from '../services/content-service'

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
  private data: ImpostorData

  public constructor(data: ImpostorData) {
    this.data = data
  }

  public readonly entity: GameEntity
  private isActive: boolean = false
  private isLoaded: boolean = false
  public initialize(): void {
    this.modelComponent = this.entity.component(ModelComponent)
    this.content = this.entity.service(ContentService)
  }

  public activate(): void {
    this.isActive = true
    if (!this.data?.model || this.isLoaded) {
      return
    }
    this.isLoaded = true
    this.content.loadModel(this.data.model, null, this.entity).then((model) => {
      this.modelComponent.model = model
    })
  }

  public deactivate(): void {
    this.isActive = false
  }

  public destroy(): void {
    //
  }
}
