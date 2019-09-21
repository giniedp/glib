import { Entity, Inject, OnInit, OnRemoved, Service } from '@gglib/ecs'
import { Model } from '@gglib/graphics'
import { SceneItemDrawable } from '@gglib/render'
import { BoundingVolumeComponent } from './BoundingVolumeComponent'
import { SceneryCollectable, SceneryCollector } from './Scenery'
import { SceneryLinkComponent } from './SceneryLinkComponent'
import { TransformComponent } from './TransformComponent'

/**
 * A component that knows how to render a model
 *
 * @public
 * @remarks
 * __Optional Services__
 * - `BoundingVolumeComponent` in order to provide a spatial bounding for this entity
 *
 * __Required Services__
 * - `TransformComponent` in order to update the position of the model
 * - `SceneryLinkComponent` in order to contribute to the scene rendering
 */
@Service()
export class ModelComponent implements SceneryCollectable, OnInit, OnRemoved {
  public readonly name = 'Model'

  /**
   * Adds a {@link ModelComponent} to the entity if it does not exist
   *
   * @param entity - The entity
   */
  public static ensure(entity: Entity) {
    BoundingVolumeComponent.ensure(entity)
    SceneryLinkComponent.ensure(entity)
    TransformComponent.ensure(entity)
    if (!entity.getService(ModelComponent, null)) {
      entity.addComponent(new ModelComponent())
    }
  }

  /**
   * Gets and seths the model to be rendered
   */
  public get model() {
    return this.$model
  }
  public set model(value: Model) {
    if (this.$model !== value) {
      this.$model = value
      this.onModelChanged()
    }
  }

  /**
   * The bounding volume component of the entity
   */
  @Inject(BoundingVolumeComponent, { optional: true })
  public readonly volume: BoundingVolumeComponent

  /**
   * The transform component of the entity
   */
  @Inject(TransformComponent)
  public readonly transform: TransformComponent

  /**
   * The scenery link component of the entity
   */
  @Inject(SceneryLinkComponent)
  public readonly link: SceneryLinkComponent

  private $model: Model
  private $drawables: SceneItemDrawable[] = []

  /**
   * Component life cycle method
   */
  public onInit() {
    this.link.register(this)
  }

  /**
   * Component life cycle method
   */
  public onRemoved() {
    this.link.unregister(this)
  }

  /**
   * SceneryCollectable method
   */
  public collectScenery(result: SceneryCollector) {
    for (let i = 0; i < this.$drawables.length; i++) {
      result.addItem(this.$drawables[i])
    }
  }

  private onModelChanged() {
    if (!this.$model) {
      this.$drawables.length = 0
      if (this.volume) {
        this.volume.linkVolume(null)
      }
      return
    }

    this.$drawables.length = this.$model.meshes.length
    for (let i = 0; i < this.$drawables.length; i++) {
      if (this.$drawables[i]) {
        this.$drawables[i].drawable = this.$model.meshes[i]
        this.$drawables[i].material = this.$model.getMaterial(this.$model.meshes[i].materialId)
        this.$drawables[i].transform = this.transform.world
      } else {
        this.$drawables[i] = {
          type: 'drawable',
          drawable: this.$model.meshes[i],
          material: this.$model.getMaterial(this.$model.meshes[i].materialId),
          transform: this.transform.world,
        }
      }
    }
    if (this.volume) {
      const volume = this.$model.boundingSphere || this.$model.boundingBox
      if (!volume) {
        console.warn('model has no bounding volume and can not provide a volume to the BoundingVolume component', this)
      }
      this.volume.linkVolume(volume)
    }
  }
}
