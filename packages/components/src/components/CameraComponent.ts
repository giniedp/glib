import { GameComponent, GameEntity } from '@gglib/ecs'
import { Device } from '@gglib/graphics'
import { DEGREE_TO_RAD, Mat4 } from '@gglib/math'
import { LayerMask, type CameraData } from '@gglib/render'
import { BehaviorComponent } from '../systems/BehaviorSystem'
import { TransformComponent } from './TransformComponent'

export type CameraType = 'perspective' | 'orthographic' | 'custom'

/**
 * Constructor options for {@link CameraComponent}
 *
 * @public
 */
export interface CameraOptions {
  /**
   * The camera type
   *
   * @remarks
   * Defines how the projection matrix is updated
   */
  type: CameraType

  /**
   * The near plane distance
   */
  near: number

  /**
   * The far plane distance
   */
  far: number

  /**
   * The aspect ratio
   */
  aspect: number

  /**
   * If enabled, the depth buffer will use reversed Z (far plane at 0, near plane at 1) to improve precision.
   */
  reversedZ: boolean

  /**
   * The field of view in radians
   *
   * @remarks
   * Only for perspective camera type
   */
  perspectiveFov: number

  /**
   * The orthographic scale
   *
   * @remarks
   * Only for orthographic camera type
   */
  orthographicScale: number

  /**
   * Custom projectin matrix
   *
   * @remarks
   * Only for custom camera type
   */
  customProjection: Mat4
}

export class CameraComponent implements CameraData, GameComponent, BehaviorComponent {
  /**
   *
   */
  public visibilityMask: number = LayerMask.All

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

  /**
   * The camera type
   *
   * @remarks
   * Defines how the projection matrix is updated
   */
  public type: CameraType = 'perspective'

  /**
   * The near plane distance
   */
  public near: number = 0.1

  /**
   * The far plane distance
   */
  public far: number = 1000

  /**
   * If enabled, the depth buffer will use reversed Z (far plane at 0, near plane at 1) to improve precision.
   */
  public reversedZ: boolean = false

  /**
   * The aspect ratio
   */
  public aspect: number = 16 / 9

  /**
   * The perspective field of view in radians
   *
   * @remarks
   * Only for perspective camera type
   */
  public perspectiveFov: number = 70 * DEGREE_TO_RAD

  /**
   * The orthographic scale in world units
   *
   * @remarls
   * Only for orthographic camera type
   */
  public orthographicScale: number = 1

  /**
   * The entity that owns this component instance
   */
  public readonly entity: GameEntity

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

  private transform: TransformComponent
  private device: Device

  constructor(options?: Partial<CameraOptions>) {
    this.configure(options)
  }

  public configure(options: Partial<CameraOptions>) {
    this.type = options?.type ?? this.type
    this.aspect = options?.aspect ?? this.aspect
    this.near = options?.near ?? this.near
    this.far = options?.far ?? this.far
    this.perspectiveFov = options?.perspectiveFov ?? this.perspectiveFov
    this.orthographicScale = options?.orthographicScale ?? this.orthographicScale
    this.reversedZ = options?.reversedZ ?? this.reversedZ

    if (this.type === 'custom' && options.customProjection) {
      this.projection.initFrom(options.customProjection)
    }
  }

  public initialize(): void {
    this.transform = this.entity.component(TransformComponent)
    this.device = this.entity.world.getSystem(Device)
  }

  public destroy(): void {
    //
  }

  /**
   * Updates the `view`, `projection` and `viewProjection` matrices
   */
  public updateBehavior(): void {
    if (this.type === 'perspective') {
      this.projection.initPerspectiveFieldOfView(
        this.perspectiveFov,
        this.aspect,
        this.near,
        this.far,
        this.device.ndcMinZ,
        this.reversedZ,
      )
    }
    if (this.type === 'orthographic') {
      this.projection.initOrthographic(
        this.orthographicScale,
        this.orthographicScale / this.aspect,
        this.near,
        this.far,
        this.device.ndcMinZ,
        this.reversedZ,
      )
    }
    Mat4.invert(this.world, this.view)
    Mat4.premultiply(this.view, this.projection, this.viewProjection)
  }
}
