// tslint:disable: max-classes-per-file

import { Mat4 } from '@gglib/math'
import { getOption } from '@gglib/utils'
import { OnUpdate } from '../Component'
import { Inject, Service } from '../decorators'
import { Entity } from './../Entity'
import { TransformComponent } from './TransformComponent'

/**
 * @public
 */
export abstract class CameraComponent {
  public name = 'Camera'

  public abstract get world(): Mat4
  public view: Mat4 = Mat4.createIdentity()
  public projection: Mat4 = Mat4.createIdentity()
  public viewProjection: Mat4 = Mat4.createIdentity()
}

/**
 * Constructor options for {@link PerspectiveCameraComponent}
 *
 * @public
 */
export interface PerspectiveCameraOptions {
  /**
   * The distance to near plane
   */
  near?: number
  /**
   * The distance to far plane
   */
  far?: number
  /**
   * The field of view
   */
  fov?: number
  /**
   * The aspect ratio
   */
  aspect?: number
}

/**
 * Adds perspective camera capability to an entity
 */
@Service({ as: CameraComponent })
export class PerspectiveCameraComponent extends CameraComponent implements OnUpdate {

  public near: number = 0.1
  public far: number = 1000
  public fov: number = Math.PI * 0.25
  public aspect: number = 4 / 3

  @Inject(Entity)
  public entity: Entity

  @Inject(TransformComponent)
  public transform: TransformComponent

  public get world() {
    return this.transform.matrix
  }

  constructor(options: PerspectiveCameraOptions = {}) {
    super()
    this.near = getOption(options, 'near', 0.1)
    this.far = getOption(options, 'far', 1000)
    this.fov = getOption(options, 'fov', 70 * Math.PI / 180)
    this.aspect = getOption(options, 'aspect', 16 / 9)
  }

  public onUpdate() {
    this.view.initFrom(this.transform.inverse)
    this.projection.initPerspectiveFieldOfView(this.fov, this.aspect, this.near, this.far)
    Mat4.multiply(this.view, this.projection, this.viewProjection)
  }
}

/**
 * Constructor options for {@link OrthographicCameraComponent}
 *
 * @public
 */
export interface OrthographicCameraOptions {
  /**
   * The distance to near plane
   */
  near?: number
  /**
   * The distance to far plane
   */
  far?: number
  /**
   * The orthographic width
   */
  width?: number
  /**
   * The orthographic height
   */
  height?: number
}

/**
 * Adds orthographic camera capability to an entity
 */
@Service({ as: CameraComponent })
export class OrthographicCameraComponent extends CameraComponent implements OnUpdate {

  public near: number
  public far: number
  public width: number
  public height: number

  @Inject(Entity)
  public entity: Entity

  @Inject(TransformComponent)
  public transform: TransformComponent

  public get world() {
    return this.transform.matrix
  }

  constructor(options: OrthographicCameraOptions = {}) {
    super()
    this.near = getOption(options, 'near', 0.1)
    this.far = getOption(options, 'far', 100)
    this.width = getOption(options, 'width', 10)
    this.height = getOption(options, 'height', 10)
  }

  public onUpdate() {
    this.view.initFrom(this.transform.inverse)
    this.projection.initOrthographic(this.width, this.height, this.near, this.far)
    Mat4.multiply(this.view, this.projection, this.viewProjection)
  }
}
