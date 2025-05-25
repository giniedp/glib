import { GameComponent, GameEntity } from '@gglib/ecs'
import { Mat4, RAD_TO_DEGREE } from '@gglib/math'
import { GameTransform } from 'ecs/src/GameTransform'
import { GameLoop } from '../systems/GameLoop'

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
export class PerspectiveCameraComponent extends CameraComponent implements GameComponent {
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
  public fov: number = 70 * RAD_TO_DEGREE

  /**
   * The aspect ratio
   */
  public aspect: number = 16 / 9

  /**
   * The entity that owns this component instance
   */
  public entity: GameEntity

  /**
   * The world transform of this camera.
   *
   * @remarks
   * This returns tha matrix of the `transform` property
   * and is meat to be read only. To change the camera transform
   * use the `transform` property.
   */
  public get world() {
    return this.entity.transform.world
  }

  private loop: GameLoop
  constructor(options?: PerspectiveCameraOptions) {
    super()
    this.setup(options)
  }

  public setup(options: PerspectiveCameraOptions) {
    this.near = options?.near ?? this.near
    this.far = options?.far ?? this.far
    this.fov = options?.fov ?? this.fov
    this.aspect = options?.aspect ?? this.aspect
  }

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.loop = entity.provider.get(GameLoop)
  }

  public activate(): void {
    this.loop.onUpdate.add(this.udpate)
  }

  public deactivate(): void {
    this.loop.onUpdate.remove(this.udpate)
  }

  public destroy(): void {
    //
  }

  /**
   * Updates the `view`, `projection` and `viewProjection` matrices
   */
  public udpate = () => {
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
export class OrthographicCameraComponent extends CameraComponent implements GameComponent {
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
  public entity: GameEntity

  /**
   * The world transform of this camera.
   *
   * @remarks
   * This returns tha matrix of the `transform` property
   * and is meat to be read only. To change the camera transform
   * use the `transform` property.
   */
  public get world() {
    return this.entity.transform.world
  }

  private loop: GameLoop
  constructor(options?: OrthographicCameraOptions) {
    super()
    if (options) {
      this.near = options.near ?? this.near
      this.far = options.far ?? this.far
      this.width = options.width ?? this.width
      this.height = options.height ?? this.height
    }
  }

  public initialize(entity: GameEntity<GameTransform>): void {
    this.entity = entity
    this.loop = entity.provider.get(GameLoop)
  }

  public activate(): void {
    this.loop.onUpdate.add(this.update)
  }

  public deactivate(): void {
    this.loop.onUpdate.remove(this.update)
  }

  public destroy(): void {
    //
  }

  /**
   * Updates the `view`, `projection` and `viewProjection` matrices
   */
  public update = () => {
    this.projection.initOrthographic(this.width, this.height, this.near, this.far)
    Mat4.invert(this.world, this.view)
    Mat4.premultiply(this.view, this.projection, this.viewProjection)
  }
}
