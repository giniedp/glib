import { Mat4 } from '@gglib/math'
import { Scene } from '@gglib/render'
import { extend, Log } from '@gglib/utils'
import { Inject, Service } from '../decorators'
import { OnAdded, OnInit, OnRemoved, OnUpdate } from './../Component'
import { Entity } from './../Entity'
import { RendererComponent } from './RendererComponent'
import { TransformComponent } from './TransformComponent'

/**
 * @public
 */
export interface CameraProperties {
  near?: number
  far?: number
  fov?: number
  aspect?: number
}

/**
 * @public
 */
@Service()
export class CameraComponent implements /*OnAdded, OnRemoved, OnInit,*/ OnUpdate {

  public near: number = 0.1
  public far: number = 1000
  public fov: number = Math.PI * 0.25
  public aspect: number = 4 / 3

  public view: Mat4 = Mat4.createIdentity()
  public projection: Mat4 = Mat4.createIdentity()
  public viewProjection: Mat4 = Mat4.createIdentity()

  @Inject(Entity)
  public entity: Entity

  @Inject(TransformComponent)
  public transform: TransformComponent

  private scene: Scene

  public get world() {
    return this.transform.worldMat
  }

  constructor(params?: CameraProperties) {
    if (params) {
      extend(this, params)
    }
  }

  public onUpdate() {
    if (this.scene && this.scene.viewport && this.scene.viewport.aspect) {
      this.aspect = this.scene.viewport.aspect
    }
    this.view.initFrom(this.transform.inverseMat)
    this.projection.initPerspectiveFieldOfView(this.fov, this.aspect, this.near, this.far)
    Mat4.multiply(this.view, this.projection, this.viewProjection)
  }

  public activate(viewId: number = 0) {
    const renderer: RendererComponent = this.entity.root.getService(RendererComponent)
    const view: Scene = renderer.manager.scenes.get(viewId)

    if (!view) {
      Log.w('[CameraComponent]', `camera can not be attached to scene ${viewId}. Scene not found.`)
      return
    }

    const oldCamera: any = view.camera
    if (oldCamera instanceof CameraComponent) {
      oldCamera.deactivate()
    }
    this.scene = view
    this.scene.camera = this
  }

  public deactivate() {
    if (this.scene) {
      this.scene.camera = void 0
      this.scene = void 0
    }
  }
}
