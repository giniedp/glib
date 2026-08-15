import type { GameComponent, GameEntity, InitializableComponent } from '@gglib/ecs'
import { LightType } from '@gglib/graphics'
import { BoundingSphere, Vec3 } from '@gglib/math'
import { BoundsComponent } from './BoundsComponent'
import type { TransformComponent } from './TransformComponent'

/**
 * Constructor options for {@link LightComponent }
 *
 * @public
 */
export interface LightComponentOptions {
  enabled?: boolean
  range?: number
  intensity?: number
  spotAngle?: number
  castShadow?: boolean
  position?: Vec3
  direction?: Vec3
  color?: Vec3
  type?: LightType
}

/**
 * Adds a light source capability to an entity
 *
 * @public
 */
export class LightComponent implements GameComponent, InitializableComponent {
  /**
   * The transform component of the entity
   */
  public transform: TransformComponent

  /**
   * The bounding volume component of the entity
   */
  public volume?: BoundsComponent

  /**
   * Enables and disables the light source
   */
  public enabled: boolean = true
  /**
   * The range of the light source (e.g. for point and spoit lights)
   */
  public range: number = 0
  /**
   * The light intensity
   */
  public intensity: number = 1
  /**
   * The cone angle of the spot light
   */
  public spotAngle: number = Math.PI / 4
  /**
   *
   */
  public castShadow: boolean = false
  /**
   * The current light position
   */
  public position: Vec3 = Vec3.create(0, 0, 0)
  /**
   * The current light direction
   */
  public direction: Vec3 = Vec3.create(0, 0, -1)
  /**
   * The current light color
   */
  public color: Vec3 = Vec3.create(1, 1, 1)
  /**
   * The light type
   */
  public type: LightType = LightType.Directional

  // public readonly params: LightParams = new LightParams()
  private localVolume = new BoundingSphere(0, 0, 0, Number.MAX_SAFE_INTEGER)

  public readonly entity: GameEntity
  public constructor(options?: LightComponentOptions) {
    this.reset(options)
  }

  public reset(options: LightComponentOptions) {
    if (options) {
      this.enabled = options.enabled ?? this.enabled
      this.range = options.range ?? this.range
      this.intensity = options.intensity ?? this.intensity
      this.spotAngle = options.spotAngle ?? this.spotAngle
      this.castShadow = options.castShadow ?? this.castShadow
      this.type = options.type ?? this.type
      this.color = Vec3.convert(options.color ?? this.color)
      this.position = Vec3.convert(options.position ?? this.position)
      this.direction = Vec3.convert(options.direction ?? this.direction)
    }
  }

  public initialize(): void {
    this.transform = this.entity.getTransform<TransformComponent>()
    this.volume = this.entity.component(BoundsComponent, { optional: true })
    this.volume?.setLocalBounds(this.localVolume, null)
  }

  public destroy(): void {
    //
  }

  public update() {
    if (this.transform) {
      this.transform.world.getForward(this.direction)
      this.transform.world.getTranslation(this.position)
    }
    this.updateParams()
  }

  public updateParams() {
    // const data = this.params
    // data.setPosition(this.position)
    // data.setDirection(this.direction)
    // data.setColor(this.color, this.intensity)
    // data.range = this.range
    // data.angle = this.spotAngle
    // data.enabled = this.enabled
    // data.type = this.type
  }
}
