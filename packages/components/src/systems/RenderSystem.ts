import { GameEntity } from '@gglib/ecs'
import { BoundingFrustum } from '@gglib/math'
import { CameraInfo, ItemInfo, LightInfo, RenderPass, SceneComposition, SceneView } from '@gglib/render'
import { BoundingVolumeComponent } from '../components/BoundingVolumeComponent'

export class RenderQuery implements SceneComposition {
  public static collectEvent = 'renderQueryCollect'
  public static notifyCollectEvent(target: GameEntity, event: CollectEvent) {
    target.events.notify(RenderQuery.collectEvent, event)
  }

  public static addCollectListener(target: GameEntity, listener: (event: CollectEvent) => void) {
    target.events.on(RenderQuery.collectEvent, listener)
  }

  public static removeCollectListener(target: GameEntity, listener: (event: CollectEvent) => void) {
    target.events.off(RenderQuery.collectEvent, listener)
  }

  public meta: Record<string, any>
  public order: number = 0
  public disabled: boolean = false
  public present: boolean = true

  public items: ItemInfo<unknown>[] = []
  public lights: LightInfo[] = []
  public views: SceneView[] = null
  public steps: RenderPass[] = null

  public camera: CameraInfo = null
  public frustum: BoundingFrustum = new BoundingFrustum()
  /**
   * Updates the render queue starting at current entity culling with current camera
   */
  public update(entities: GameEntity[], camera: CameraInfo) {
    // reset state
    this.items.length = 0
    this.lights.length = 0
    this.camera = camera
    if (!camera || !entities?.length) {
      return
    }

    // update frustum
    this.frustum.matrix.initFrom(camera.view)
    this.frustum.matrix.premultiply(camera.projection)
    this.frustum.update()

    // traverse and cull the scene
    for (const entity of entities) {
      this.walk(entity)
    }
  }

  public addItem(item: ItemInfo) {
    this.items.push(item)
  }

  public addLight(light: LightInfo) {
    this.lights.push(light)
  }

  protected walk(entity: GameEntity) {
    if (!entity.active) {
      return
    }
    this.visit(entity)
    for (const child of entity.transform.children) {
      this.walk(child.entity)
    }
  }

  protected visit(entity: GameEntity) {
    const bounds = entity.component(BoundingVolumeComponent, true)
    if (!bounds || !bounds.volume || bounds.volume.intersectsFrustum(this.frustum)) {
      RenderQuery.notifyCollectEvent(entity, this)
    }
  }
}

/**
 * Event being fired when an entity is being collected into the visible set
 *
 * @public
 */
export interface CollectEvent {
  // readonly scene: Composition
  // readonly frustum: BoundingFrustum
  addItem(item: ItemInfo): void
  addLight(light: LightInfo): void
}
