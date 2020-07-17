import { Entity, Inject, OnUpdate, Component } from '@gglib/ecs'
import { Mat4 } from '@gglib/math'
import { getOption } from '@gglib/utils'
import { TransformComponent } from './TransformComponent'

/**
 * An abstract component that describes a camera
 *
 * @public
 * @remarks
 * ## What it does
 * Provides access to the `view` and `projection` matrices.
 *
 * ## Required Services
 * Services implementing this class usually require the `TransformComponent`
 * in order to update the `view` matrix
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
 * @remarks
 * ## What it does
 * Provides access to the `view` and `projection` matrices.
 * Updates the `view` matrix according to the current state of the `TransformComponent`.
 * Updates the `projection` matrix according to the component settings.
 *
 * ## Required Services
 * - `TransformComponent`
 */
@Component({ as: CameraComponent, install: [TransformComponent] })
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
    return this.transform.world
  }

  constructor(options: PerspectiveCameraOptions = {}) {
    super()
    this.near = getOption(options, 'near', 0.1)
    this.far = getOption(options, 'far', 1000)
    this.fov = getOption(options, 'fov', (70 * Math.PI) / 180)
    this.aspect = getOption(options, 'aspect', 16 / 9)
  }

  /**
   * Updates the `view`, `projection` and `viewProjection` matrices
   */
  public onUpdate() {
    this.projection.initPerspectiveFieldOfView(this.fov, this.aspect, this.near, this.far)
    Mat4.invert(this.world, this.view)
    Mat4.premultiply(this.view, this.projection, this.viewProjection)
  }
}

/**
 * Constructor options for {@link OrthographicCameraComponent}
 *
 * @public
 * @remarks
 * ## What it does
 * Provides access to the `view` and `projection` matrices.
 * Updates the `view` matrix according to the current state of the `TransformComponent`.
 * Updates the `projection` matrix according to the component settings.
 *
 * ## Required Services
 * - `TransformComponent`
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
@Component({ as: CameraComponent, install: [TransformComponent] })
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
    return this.transform.world
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
    this.projection.initOrthographic(this.width, this.height, this.near, this.far)
    Mat4.invert(this.world, this.view)
    Mat4.premultiply(this.view, this.projection, this.viewProjection)
  }
}
