import { Entity, Inject, OnInit, OnRemoved, OnUpdate, Service } from '@gglib/ecs'
import { LightParams } from '@gglib/effects'
import { LightType } from '@gglib/graphics'
import { BoundingSphere, Vec3 } from '@gglib/math'
import { getOption } from '@gglib/utils'

import { BoundingVolumeComponent } from './BoundingVolumeComponent'
import { SceneryCollectable, SceneryCollector } from './Scenery'
import { SceneryLinkComponent } from './SceneryLinkComponent'
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
@Service()
export class LightComponent implements SceneryCollectable, OnInit, OnUpdate, OnRemoved {
  /**
   * Adds a {@link LightComponent} to the entity if it does not exist
   *
   * @param entity - The entity
   * @param options - Constructor options for the {@link LightComponent}
   */
  public static addPointLight(entity: Entity, options: LightComponentOptions = {}) {
    BoundingVolumeComponent.ensure(entity)
    SceneryLinkComponent.ensure(entity)
    if (!entity.services.has(LightComponent)) {
      options.type = LightType.Point
      entity.addComponent(new LightComponent(options))
    }
  }

  /**
   * Adds a {@link LightComponent} to the entity if it does not exist
   *
   * @param entity - The entity
   * @param options - Constructor options for the {@link LightComponent}
   */
  public static addSpotLight(entity: Entity, options: LightComponentOptions = {}) {
    BoundingVolumeComponent.ensure(entity)
    SceneryLinkComponent.ensure(entity)
    if (!entity.services.has(LightComponent)) {
      options.type = LightType.Spot
      entity.addComponent(new LightComponent(options))
    }
  }

  /**
   * Adds a {@link LightComponent} to the entity if it does not exist
   *
   * @param entity - The entity
   * @param options - Constructor options for the {@link LightComponent}
   */
  public static addDirectionalLight(entity: Entity, options: LightComponentOptions = {}) {
    BoundingVolumeComponent.ensure(entity)
    SceneryLinkComponent.ensure(entity)
    if (!entity.services.has(LightComponent)) {
      options.type = LightType.Directional
      entity.addComponent(new LightComponent(options))
    }
  }

  /**
   * Adds a {@link LightComponent} to the entity if it does not exist
   *
   * @param entity - The entity
   * @param options - Constructor options for the {@link LightComponent}
   */
  public static addLight(entity: Entity, options: LightComponentOptions = {}) {
    BoundingVolumeComponent.ensure(entity)
    SceneryLinkComponent.ensure(entity)
    if (!entity.services.has(LightComponent)) {
      entity.addComponent(new LightComponent(options))
    }
  }

  /**
   * The transform component of the entity
   */
  @Inject(TransformComponent)
  public readonly transform: TransformComponent

  /**
   * The scenery link component of the entity
   */
  @Inject(SceneryLinkComponent)
  public readonly link: SceneryLinkComponent

  /**
   * The bounding volume component of the entity
   */
  @Inject(BoundingVolumeComponent, { optional: true })
  public readonly volume?: BoundingVolumeComponent

  /**
   * Enables and disables the light source
   */
  public enabled: boolean
  /**
   * The range of the light source (e.g. for point and spoit lights)
   */
  public range: number
  /**
   * The light intensity
   */
  public intensity: number
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
  public position: Vec3
  /**
   * The current light direction
   */
  public direction: Vec3
  /**
   * The current light color
   */
  public color: Vec3
  /**
   * The light type
   */
  public type: LightType

  public readonly params: LightParams
  private localVolume = new BoundingSphere(0, 0, 0, Number.MAX_SAFE_INTEGER)

  constructor(params?: LightComponentOptions) {
    this.enabled = getOption(params, 'enabled', true)
    this.range = getOption(params, 'range', 0)
    this.intensity = getOption(params, 'intensity', 1)
    this.spotAngle = getOption(params, 'spotAngle', Math.PI / 4)
    this.castShadow = getOption(params, 'castShadow', false)
    this.type = getOption(params, 'type', LightType.Directional)
    this.color = Vec3.convert(getOption(params, 'color', Vec3.create(1, 1, 1)))
    this.position = Vec3.convert(getOption(params, 'position', Vec3.create(0, 0, 0)))
    this.direction = Vec3.convert(getOption(params, 'direction', Vec3.create(0, 0, -1)))

    this.type = this.type
    this.params = new LightParams()
  }

  /**
   * Component life cycle method
   */
  public onInit() {
    this.link.register(this)
    if (this.volume) {
      this.volume.linkVolume(this.localVolume)
    }
  }

  /**
   * Component life cycle method
   */
  public onRemoved() {
    this.link.unregister(this)
  }

  /**
   * Component life cycle method
   */
  public onUpdate() {
    if (this.transform) {
      this.transform.world.getForward(this.direction)
      this.transform.world.getTranslation(this.position)
    }
    this.updateParams()
  }

  /**
   * Updates LightParams object
   */
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

  /**
   * SceneryCollectable method
   */
  public collectScenery(collector: SceneryCollector): void {
    collector.addLight(this.params)
  }
}
