import { Entity, Inject, OnDraw, OnInit, Service } from '@gglib/ecs'
import { Device } from '@gglib/graphics'
import { BasicRenderStep, LightSourceData, RenderManager, Scene, SceneItem } from '@gglib/render'

import { BoundingFrustum, Mat4 } from '@gglib/math'
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
@Service()
export class RendererComponent implements OnInit, OnDraw {
  @Inject(Entity)
  public entity: Entity

  @Inject(TimeComponent, { from: 'root' })
  public time: TimeComponent

  @Inject(Device, { from: 'root' })
  public device: Device

  public manager: RenderManager
  public cullVisitor: CullVisitor

  public constructor(options: RendererComponentOptions = {}) {
    this.manager = getOption(options, 'manager', null)
    this.cullVisitor = getOption(options, 'cullVisitor', new BruteForceCullVisitor())
  }

  public onInit() {
    this.manager = this.manager || new RenderManager(this.device)
    this.manager.addScene({
      id: 0,
      steps: [new BasicRenderStep()],
      items: [],
      lights: [],
    })
  }

  public onDraw() {
    this.manager.eachScene(this.cullScene, this)
    this.manager.update()
    this.manager.binder.updateTime(this.time.game.totalMs, this.time.game.elapsedMs)
    this.manager.render()
  }

  private cullScene(scene: Scene) {
    this.cullVisitor.run(this.entity, scene)
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
    if (!scene.camera) {
      return
    }
    if (scene.camera.viewProjection) {
      this.frustum.update(scene.camera.viewProjection)
    } else {
      this.frustum.matrix.initFrom(scene.camera.view)
      this.frustum.matrix.premultiply(scene.camera.projection)
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
    const bounds = entity.getService(BoundingVolumeComponent, null)
    if (bounds && bounds.volume && !bounds.volume.intersectsFrustum(this.frustum)) {
      return
    }

    const link = entity.getService(SceneryLinkComponent, null)
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

    if (!scene.camera) {
      return
    }

    if (scene.camera.viewProjection) {
      this.frustum.update(scene.camera.viewProjection)
    } else {
      this.frustum.matrix.initFrom(scene.camera.view)
      this.frustum.matrix.premultiply(scene.camera.projection)
      this.frustum.update()
    }
    node.getService(SpatialSystemComponent).testFrustum(this.frustum, this.entities)
    this.entities.forEach(this.visit, this)
  }

  public addItem(item: SceneItem) {
    this.scene.items.push(item)
  }

  public addLight(light: LightSourceData) {
    this.scene.lights.push(light)
  }

  private visit(entity: Entity) {
    const link = entity.getService(SceneryLinkComponent, null)
    if (link) {
      link.collectScenery(this)
    }
  }
}
