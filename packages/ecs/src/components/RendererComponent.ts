// tslint:disable:max-classes-per-file

import { Device } from '@gglib/graphics'
import { BasicStage, DrawableData, LightData, Manager as RenderManager, Scene } from '@gglib/render'
import { Inject, Service } from '../decorators'
import { OnDraw, OnInit, OnUpdate } from './../Component'
import { Entity } from './../Entity'
import { LightComponent } from './LightComponent'
import { DrawablesProvider } from './Renderable'
import { TimeComponent } from './TimeComponent'

/**
 * @public
 */
export interface CullVisitor {
  run(entity: Entity, view: Scene): void
  addDrawable(item: DrawableData): void
  addLight(item: LightData): void
}

/**
 * @public
 */
@Service()
export class RendererComponent implements OnInit, OnUpdate, OnDraw {

  @Inject(Entity)
  public entity: Entity

  @Inject(TimeComponent, { from: 'root' })
  public time: TimeComponent

  @Inject(Device, { from: 'root' })
  public device: Device

  public manager: RenderManager
  public cullVisitor: CullVisitor = new SimpleCullVisitor()

  private toRender: Scene[] = []

  public onInit() {
    this.manager = new RenderManager(this.device)
    this.manager.addScene({
      id: 0,
      enabled: true,
      steps: [new BasicStage()],
      items: [],
      lights: [],
    })
  }

  public onUpdate() {
    this.manager.update()
  }

  public onDraw() {
    this.toRender.length = 0
    this.manager.device.resize()
    this.manager.binder.updateTime(this.time.totalMsInGame, this.time.elapsedMsInGame)
    this.manager.scenes.forEach((scene) => {
      if (!scene || !scene.camera || scene.enabled === false) {
        return
      }
      const camera = scene.camera
      this.manager.binder.setCamera(camera.world, camera.view, camera.projection)
      this.cullVisitor.run(this.entity.root, scene)
      this.manager.renderScene(scene)
      this.toRender.push(scene)
    })
    this.manager.presentScenes(this.toRender)
  }
}

/**
 * @public
 */
export class SimpleCullVisitor implements CullVisitor {
  public scene: Scene

  public run(node: Entity, scene: Scene) {
    this.scene = scene
    scene.items.length = 0
    scene.lights.length = 0
    this.acceptVisitor(node)
  }

  public addDrawable(item: DrawableData) {
    this.scene.items.push(item)
  }

  public addLight(light: LightData) {
    this.scene.lights.push(light)
  }

  private acceptVisitor(node: Entity) {
    this.visit(node)
    for (const child of node.children) {
      this.acceptVisitor(child)
    }
  }

  private visit(entity: Entity) {
    const comp: DrawablesProvider = entity.getService(DrawablesProvider, null)
    if (comp) {
      comp.collectDrawables(this)
    }
    const light = entity.getService(LightComponent, null)
    if (light && light.enabled) {
      this.addLight(light.params)
    }
  }
}
