// tslint:disable:max-classes-per-file

import { Device } from '@glib/graphics'
import * as Render from '@glib/render'
import { Component } from './../Component'
import { Entity } from './../Entity'
import { Visitor } from './../Visitor'
import { AssetsComponent } from './AssetsComponent'
import { LightComponent } from './LightComponent'
import { TimeComponent } from './TimeComponent'

export interface CullVisitor {
  start(entity: Entity, view: Render.View): void
  add(item: Render.ItemData): void
}

export interface RenderableCollector {
  add(item: Render.ItemData): void
}

export interface Renderable {
  collect(collector: RenderableCollector): void
}

export class RendererComponent implements Component {
  public entity: Entity
  public name: string = 'Renderer'
  public service: boolean = true
  public enabled: boolean = true
  public visible: boolean = true

  public time: TimeComponent
  public device: Device
  public assets: AssetsComponent
  public manager: Render.Manager
  public cullVisitor: CullVisitor = new SimpleCullVisitor()

  public setup() {
    this.time = this.entity.root.getService('Time')
    this.device = this.entity.root.getService('Device')
    this.assets = this.entity.root.getService('Assets')
    this.manager = new Render.Manager(this.device)
    this.manager.addView({
      enabled: true,
      steps: [new Render.StepForward()],
      items: [],
      lights: [],
    })
  }

  public update() {
    this.manager.update()
    this.manager.binder.updateTime(this.time.totalMsInGame, this.time.elapsedMsInGame)
  }

  public draw() {
    this.manager.device.resize()
    for (let view of this.manager.views) {
      this.renderView(view)
    }
    this.manager.presentViews()
  }

  private renderView(view: Render.View) {
    if (!view || !view.camera || view.enabled === false) {
      return
    }
    let camera = view.camera
    let binder = this.manager.binder
    view.items.length = 0
    view.lights.length = 0
    binder.updateCamera(camera.world, camera.view, camera.projection)
    this.cullVisitor.start(this.entity.root, view)
    this.manager.renderView(view)
  }
}

export class SimpleCullVisitor implements CullVisitor, Visitor<Entity> {
  public view: Render.View

  public start(node: Entity, view: Render.View) {
    this.view = view
    node.acceptVisitor(this)
  }

  public visit(entity: Entity) {
    let comp = entity.s['Renderable'] as Renderable
    if (comp) {
      comp.collect(this)
    }
    let light = entity.s['Light'] as LightComponent
    if (light) {
      this.addLight(light.packedData)
    }
  }

  public add(item: Render.ItemData) {
    this.view.items.push(item)
  }

  public addLight(light: Render.LightData) {
    this.view.lights.push(light)
  }
}
