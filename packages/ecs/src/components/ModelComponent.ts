import { Model } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { DrawableData } from '@gglib/render'
import { Inject } from '../decorators'
import { OnAdded, OnRemoved } from './../Component'
import { Entity } from './../Entity'
import { DrawablesCollector, DrawablesProvider } from './Renderable'
import { TransformComponent } from './TransformComponent'

/**
 * @public
 */
export class ModelComponent extends DrawablesProvider implements OnAdded, OnRemoved {

  public get model() {
    return this.$model
  }
  public set model(value: Model) {
    this.$model = value
    this.$drawables.length = 0
    if (value) {
      this.$drawables = value.meshes.map((it) => {
        return {
          drawable: it,
          material: value.materials[it.materialId] || value.materials.find((e) => e.name === it.materialId),
          transform: this.world,
          data: null,
        }
      })
    }
  }

  @Inject(TransformComponent)
  public transform: TransformComponent

  private world: Mat4 = Mat4.createIdentity()
  private $model: Model
  private $drawables: DrawableData[] = []

  constructor() {
    super()
  }

  public onAdded(entity: Entity) {
    entity.addService(ModelComponent, this)
    entity.addService(DrawablesProvider as any, this as DrawablesProvider)
  }

  public onRemoved(entity: Entity) {
    entity.removeService(ModelComponent)
    entity.removeService(DrawablesProvider)
  }

  public onUpdate() {
    if (this.transform) {
      this.world.initFrom(this.transform.matrix)
    }
  }

  public collectDrawables(result: DrawablesCollector) {
    for (const it of this.$drawables) {
      result.addDrawable(it)
    }
  }
}
