import { Inject, OnInit, OnUpdate, Component, OnSetup, Listener } from '@gglib/ecs'
import { LightParams } from '@gglib/fx-materials'
import { LightType } from '@gglib/graphics'
import { BoundingSphere, Vec3 } from '@gglib/math'
import { getOption } from '@gglib/utils'

import { BoundingVolumeComponent } from './BoundingVolumeComponent'
import { ScenePartComponent, ScenePartCollector } from './ScenePartComponent'
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
@Component({
  install: [
    BoundingVolumeComponent,
    TransformComponent,
    ScenePartComponent,
  ]
})
export class LightComponent implements OnInit, OnUpdate, OnSetup<LightComponentOptions> {

  /**
   * The transform component of the entity
   */
  @Inject(TransformComponent)
  public readonly transform: TransformComponent

  /**
   * The bounding volume component of the entity
   */
  @Inject(BoundingVolumeComponent, { optional: true })
  public readonly volume?: BoundingVolumeComponent

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

  constructor(options?: LightComponentOptions) {
    if (options) {
      this.onSetup(options)
    }
  }

  public onSetup(options: LightComponentOptions) {
    this.enabled = getOption(options, 'enabled', this.enabled)
    this.range = getOption(options, 'range', this.range)
    this.intensity = getOption(options, 'intensity', this.intensity)
    this.spotAngle = getOption(options, 'spotAngle', this.spotAngle)
    this.castShadow = getOption(options, 'castShadow', this.castShadow)
    this.type = getOption(options, 'type', this.type)
    this.color = Vec3.convert(getOption(options, 'color', this.color))
    this.position = Vec3.convert(getOption(options, 'position', this.position))
    this.direction = Vec3.convert(getOption(options, 'direction', this.direction))
  }

  /**
   * Component life cycle method
   */
  public onInit() {
    this.volume?.linkVolume(this.localVolume)
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

  @Listener(ScenePartComponent.EVENT_COLLECT)
  public collectPart(collector: ScenePartCollector): void {
    collector.addLight(this.params)
  }
}
