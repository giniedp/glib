import { GameComponent, GameEntity } from '@gglib/ecs'
import { Device } from '@gglib/graphics'
import {
  DEGREE_TO_RAD,
  IRay,
  mat4,
  Mat4,
  mat4$initFrom,
  mat4$initOrthographic,
  mat4$initPerspectiveFieldOfView,
  mat4Identity,
  mat4Invert,
  mat4Premultiply,
  rayCreate,
  SpaceBasis,
  vec3,
  vec3$normalize,
  vec3$projectMat4,
  vec3Subtract,
} from '@gglib/math'
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
  public view: Mat4 = mat4Identity()

  /**
   * The projection matrix
   */
  public projection: Mat4 = mat4Identity()

  /**
   * The premultiplied view and projection matrix
   */
  public viewProjection: Mat4 = mat4Identity()

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

  private space: SpaceBasis
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
      mat4$initFrom(this.projection, options.customProjection)
    }
  }

  public initialize(): void {
    this.space = this.entity.service(SpaceBasis)
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
    switch (this.type) {
      case 'custom': {
        // custom projection is only initialized during configure
        break
      }
      case 'perspective': {
        mat4$initPerspectiveFieldOfView(
          this.projection,
          this.perspectiveFov,
          this.aspect,
          this.near,
          this.far,
          this.device.ndcMinZ,
          this.reversedZ,
        )
        break
      }
      case 'orthographic': {
        mat4$initOrthographic(
          this.projection,
          this.orthographicScale,
          this.orthographicScale / this.aspect,
          this.near,
          this.far,
          this.device.ndcMinZ,
          this.reversedZ,
        )
        break
      }
    }
    mat4Invert(this.world, this.view)
    mat4Premultiply(this.view, this.space.toViewSpace, this.view)
    mat4Premultiply(this.view, this.projection, this.viewProjection)
  }

  public createRay(xNormalized: number, yNormalized: number): IRay {
    const ndcX = xNormalized * 2.0 - 1.0
    const ndcY = 1.0 - yNormalized * 2.0
    const invViewProj = mat4Invert(this.viewProjection, mat4.$0)
    const nearZ = this.reversedZ ? 1.0 : this.device.ndcMinZ
    const farZ = this.reversedZ ? 0.0 : 1.0
    const near = vec3$projectMat4(vec3(ndcX, ndcY, nearZ), invViewProj)
    const far = vec3$projectMat4(vec3(ndcX, ndcY, farZ), invViewProj)
    const dir = vec3Subtract(far, near)
    vec3$normalize(dir)
    return rayCreate(near, dir)
  }
}
