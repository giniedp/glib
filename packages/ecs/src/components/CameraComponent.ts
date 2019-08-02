// tslint:disable: max-classes-per-file

import { Mat4 } from '@gglib/math'
import { getOption } from '@gglib/utils'
import { OnUpdate } from '../Component'
import { Inject, Service } from '../decorators'
import { Entity } from './../Entity'
import { TransformComponent } from './TransformComponent'

/**
 * An abstract component that describes a camera
 *
 * @public
 */
export abstract class CameraComponent {

  /**
   * The component name (`'Camera'`)
   */
  public readonly name = 'Camera'

  /**
   * The world transform
   */
  public abstract get world(): Mat4

  /**
   * The view matrix that is the inverse of the world transform
   */
  public view: Mat4 = Mat4.createIdentity()

  /**
   * The projection matrix
   */
  public projection: Mat4 = Mat4.createIdentity()

  /**
   * The premultiplied view and projection matrix
   */
  public viewProjection: Mat4 = Mat4.createIdentity()
}

/**
 * Constructor options for {@link PerspectiveCameraComponent}
 *
 * @public
 */
export interface PerspectiveCameraOptions {
  /**
   * The near plane distance
   */
  near?: number
  /**
   * The far plane distance
   */
  far?: number
  /**
   * The field of view in radians
   */
  fov?: number
  /**
   * The aspect ratio
   */
  aspect?: number
}

/**
 * Adds perspective camera capability to an entity
 *
 * @public
 */
@Service({ as: CameraComponent })
export class PerspectiveCameraComponent extends CameraComponent implements OnUpdate {

  /**
   * The near plane distance
   */
  public near: number = 0.1

  /**
   * The far plane distance
   */
  public far: number = 1000

  /**
   * The field of view in radians
   */
  public fov: number = Math.PI * 0.25

  /**
   * The aspect ratio
   */
  public aspect: number = 4 / 3

  /**
   * The entity that owns this component instance
   */
  @Inject(Entity)
  public readonly entity: Entity

  /**
   * The transform component
   */
  @Inject(TransformComponent)
  public readonly transform: TransformComponent

  /**
   * The world transform of this camera.
   *
   * @remarks
   * This returns tha matrix of the `transform` property
   * and is meat to be read only. To change the camera transform
   * use the `transform` property.
   */
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

  /**
   * Updates the `view`, `projection` and `viewProjection` matrices
   */
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
   * The near plane distance
   */
  near?: number

  /**
   * The far plane distance
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
 *
 * @public
 */
@Service({ as: CameraComponent })
export class OrthographicCameraComponent extends CameraComponent implements OnUpdate {

  /**
   * The near plane distance
   */
  public near: number = 0.1

  /**
   * The far plane distance
   */
  public far: number = 1000
  /**
   * The orthographic width
   */
  public width: number = 10
  /**
   * The orthographic height
   */
  public height: number = 10

  /**
   * The entity that owns this component instance
   */
  @Inject(Entity)
  public readonly entity: Entity

  /**
   * The transform component
   */
  @Inject(TransformComponent)
  public readonly transform: TransformComponent

  /**
   * The world transform of this camera.
   *
   * @remarks
   * This returns tha matrix of the `transform` property
   * and is meat to be read only. To change the camera transform
   * use the `transform` property.
   */
  public get world() {
    return this.transform.matrix
  }

  constructor(options: OrthographicCameraOptions = {}) {
    super()
    this.near = getOption(options, 'near', this.near)
    this.far = getOption(options, 'far', this.far)
    this.width = getOption(options, 'width', this.width)
    this.height = getOption(options, 'height', this.height)
  }

  /**
   * Updates the `view`, `projection` and `viewProjection` matrices
   */
  public onUpdate() {
    this.view.initFrom(this.transform.inverse)
    this.projection.initOrthographic(this.width, this.height, this.near, this.far)
    Mat4.multiply(this.view, this.projection, this.viewProjection)
  }
}
