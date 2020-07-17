import { Entity, Inject, OnDraw, OnInit, Component } from '@gglib/ecs'
import { Device } from '@gglib/graphics'
import { BasicRenderStep, LightSourceData, RenderManager, Scene, SceneItem } from '@gglib/render'

import { BoundingFrustum } from '@gglib/math'
import { getOption } from '@gglib/utils'
import { BoundingVolumeComponent } from './BoundingVolumeComponent'
import { SceneryCollector } from './Scenery'
import { SceneryLinkComponent } from './SceneryLinkComponent'
import { SpatialSystemComponent } from './SpatialSystemComponent'
import { TimeComponent } from './TimeComponent'

/**
 * @public
 */
export interface CullVisitor extends SceneryCollector {
  run(entity: Entity, view: Scene): void
}

/**
 * @public
 */
export interface RendererComponentOptions {
  manager?: RenderManager
  cullVisitor?: CullVisitor
}

/**
 * @public
 */
@Component()
export class RendererComponent implements OnInit, OnDraw {
  @Inject(Entity)
  public entity: Entity

  @Inject(TimeComponent, { from: 'root' })
  public time: TimeComponent

  @Inject(Device, { from: 'root' })
  public device: Device

  public manager: RenderManager
  public cullVisitor: CullVisitor
  public scenes: Scene[] = []

  /**
   * Gets the default scene (scene at index `0`)
   */
  public get scene() {
    this.ensureSceneValidity()
    return this.scenes[0]
  }

  /**
   * Gets the default view (view at index `0`) of default scene
   */
  public get view() {
    this.ensureSceneValidity()
    return this.scene.views[0]
  }

  public constructor(options: RendererComponentOptions = {}) {
    this.manager = getOption(options, 'manager', null)
    this.cullVisitor = getOption(options, 'cullVisitor', new BruteForceCullVisitor())
  }

  public onInit() {
    this.manager = this.manager || new RenderManager(this.device)
    this.ensureSceneValidity(0)
  }

  public onDraw() {
    for (const scene of this.scenes) {
      if (!scene.disabled) {
        this.cullVisitor.run(this.entity, scene)
      }
    }
    this.manager.update()
    this.manager.binder.updateTime(this.time.game.totalMs, this.time.game.elapsedMs)
    this.manager.render(this.scenes)
  }

  public addScene<T extends Scene>(scene: T) {
    this.scenes.push(scene)
  }

  private ensureSceneValidity(index: number = 0, view: number = 0) {
    if (!this.scenes[index]) {
      this.scenes[index] = {
        steps: [new BasicRenderStep()],
        items: [],
        lights: [],
        views: [],
      }
    }
    if (!this.scenes[index].views[view]) {
      this.scenes[index].views[view] = {
        viewport: {
          x: 0,
          y: 0,
          width: 1,
          height: 1,
          type: 'normalized',
        }
      }
    }
    if (!this.scenes[index].views[view].viewport) {
      this.scenes[index].views[view].viewport = {
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        type: 'normalized',
      }
    }
  }
}

/**
 * @public
 */
export class BruteForceCullVisitor implements CullVisitor {
  public scene: Scene
  public readonly frustum: BoundingFrustum = new BoundingFrustum()

  public run(node: Entity, scene: Scene) {
    this.scene = scene
    scene.items.length = 0
    scene.lights.length = 0
    const camera = scene.camera || scene.views[0]?.camera
    if (!camera) {
      return
    }
    if (camera.viewProjection) {
      this.frustum.update(camera.viewProjection)
    } else {
      this.frustum.matrix.initFrom(camera.view)
      this.frustum.matrix.premultiply(camera.projection)
      this.frustum.update()
    }

    this.acceptVisitor(node)
  }

  public addItem(item: SceneItem) {
    this.scene.items.push(item)
  }

  public addLight(light: LightSourceData) {
    this.scene.lights.push(light)
  }

  private acceptVisitor(node: Entity) {
    this.visit(node)
    for (const child of node.children) {
      this.acceptVisitor(child)
    }
  }

  private visit(entity: Entity) {
    const bounds = entity.get(BoundingVolumeComponent, null)
    if (bounds && bounds.volume && !bounds.volume.intersectsFrustum(this.frustum)) {
      return
    }

    const link = entity.get(SceneryLinkComponent, null)
    if (link) {
      link.collectScenery(this)
    }
  }
}

/**
 * @public
 */
export class SpatialCullVisitor implements CullVisitor {
  public readonly frustum: BoundingFrustum = new BoundingFrustum()
  public readonly entities: Entity[] = []
  public scene: Scene

  public run(node: Entity, scene: Scene) {
    scene.items.length = 0
    scene.lights.length = 0
    this.entities.length = 0
    this.scene = scene
    const camera = scene.camera || scene.views[0]?.camera
    if (!camera) {
      return
    }

    if (camera.viewProjection) {
      this.frustum.update(camera.viewProjection)
    } else {
      this.frustum.matrix.initFrom(camera.view)
      this.frustum.matrix.premultiply(camera.projection)
      this.frustum.update()
    }
    node.get(SpatialSystemComponent).testFrustum(this.frustum, this.entities)
    this.entities.forEach(this.visit, this)
  }

  public addItem(item: SceneItem) {
    this.scene.items.push(item)
  }

  public addLight(light: LightSourceData) {
    this.scene.lights.push(light)
  }

  private visit(entity: Entity) {
    const link = entity.get(SceneryLinkComponent, null)
    if (link) {
      link.collectScenery(this)
    }
  }
}
