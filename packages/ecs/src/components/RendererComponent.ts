// tslint:disable:max-classes-per-file

import { Device } from '@gglib/graphics'
import { BasicStage, DrawableData, LightData, Manager as RenderManager, Scene } from '@gglib/render'
import { OnAdded, OnDraw, OnInit, OnRemoved, OnUpdate } from './../Component'
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
export class RendererComponent implements OnAdded, OnRemoved, OnInit, OnUpdate, OnDraw {
  public entity: Entity

  public time: TimeComponent
  public device: Device
  public manager: RenderManager
  public cullVisitor: CullVisitor = new SimpleCullVisitor()

  private toRender: Scene[] = []

  public onAdded(entity: Entity) {
    this.entity = entity
    entity.addService(RendererComponent, this)
  }

  public onRemoved(entity: Entity) {
    entity.removeService(RendererComponent)
    this.entity = null
  }

  public onInit() {
    this.time = this.entity.root.getService(TimeComponent)
    this.device = this.entity.root.getService(Device)
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
    this.manager.binder.updateTime(this.time.totalMsInGame, this.time.elapsedMsInGame)
  }

  public onDraw() {
    this.toRender.length = 0
    this.manager.device.resize()
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
