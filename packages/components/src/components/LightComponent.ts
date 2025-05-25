import { GameComponent, GameEntity } from '@gglib/ecs'
import { LightParams } from '@gglib/materials'
import { LightType } from '@gglib/graphics'
import { BoundingSphere, Vec3 } from '@gglib/math'

import { CollectEvent, RenderQuery } from '../systems/RenderSystem'
import { BoundingVolumeComponent } from './BoundingVolumeComponent'
import { TransformComponent } from './TransformComponent'

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
export class LightComponent implements GameComponent {
  /**
   * The transform component of the entity
   */
  public get transform(): TransformComponent {
    return this.entity.transform
  }

  /**
   * The bounding volume component of the entity
   */
  public volume?: BoundingVolumeComponent

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

  public readonly params: LightParams = new LightParams()
  private localVolume = new BoundingSphere(0, 0, 0, Number.MAX_SAFE_INTEGER)

  public entity: GameEntity<TransformComponent>
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

  public initialize(entity: GameEntity<TransformComponent>): void {
    this.entity = entity
    this.volume = entity.component(BoundingVolumeComponent, true)
    this.volume?.linkVolume(this.localVolume)
  }

  public activate(): void {
    this.entity.transform.onUpdated.add(this.update)
    RenderQuery.addCollectListener(this.entity, this.collect)
  }

  public deactivate(): void {
    this.entity.transform.onUpdated.remove(this.update)
    RenderQuery.removeCollectListener(this.entity, this.collect)
  }

  public destroy(): void {
    //
  }

  public update = () => {
    if (this.transform) {
      this.transform.world.getForward(this.direction)
      this.transform.world.getTranslation(this.position)
    }
    this.updateParams()
  }

  public updateParams() {
    const data = this.params
    data.setPosition(this.position)
    data.setDirection(this.direction)
    data.setColor(this.color, this.intensity)
    data.range = this.range
    data.angle = this.spotAngle
    data.enabled = this.enabled
    data.type = this.type
  }

  public collect = (e: CollectEvent): void => {
    e.addLight(this.params)
  }
}
