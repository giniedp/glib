import { extend } from '@gglib/core'
import { Mat4 } from '@gglib/math'
import { View as RenderView } from '@gglib/render'
import { Component } from './../Component'
import { Entity } from './../Entity'
import { RendererComponent } from './RendererComponent'
import { TransformComponent } from './TransformComponent'
export interface CameraProperties {
  near?: number
  far?: number
  fov?: number
  aspect?: number
}

export class CameraComponent implements Component {
  public name = 'Camera'
  public entity: Entity
  public service: boolean = true
  public enabled: boolean = true

  public near: number = 0.1
  public far: number = 1000
  public fov: number = Math.PI * 0.25
  public aspect: number = 4 / 3

  public view: Mat4 = Mat4.createIdentity()
  public projection: Mat4 = Mat4.createIdentity()
  public viewProjection: Mat4 = Mat4.createIdentity()
  public transform: TransformComponent
  private targetView: RenderView

  public get world() {
    return this.transform.worldMat
  }

  constructor(params?: CameraProperties) {
    if (params) {
      extend(this, params)
    }
  }

  public setup() {
    this.transform = this.entity.getService('Transform')
  }

  public update() {
    if (this.targetView) {
      this.aspect = this.targetView.width / this.targetView.height
    }
    this.view.initFrom(this.transform.inverseMat)
    this.projection.initPerspectiveFieldOfView(this.fov, this.aspect, this.near, this.far)
    Mat4.multiply(this.view, this.projection, this.viewProjection)
  }

  public activate(viewIndex: number = 0) {
    const renderer: RendererComponent = this.entity.root.getService('Renderer')
    const view: RenderView = renderer.manager.views[viewIndex]

    if (!view) {
      // TODO: log
      return
    }

    const oldCamera: any = view.camera
    if (oldCamera instanceof CameraComponent) {
      oldCamera.deactivate()
    }
    this.targetView = view
    this.targetView.camera = this
  }

  public deactivate() {
    if (this.targetView) {
      this.targetView.camera = void 0
      this.targetView = void 0
    }
  }
}
