import { Vec3 } from '@gglib/math'
import { getOption } from '@gglib/utils'

import { LightParams } from '@gglib/effects'
import { LightType } from '@gglib/graphics'
import { Inject, Service } from '../decorators'
import { OnUpdate } from './../Component'
import { Entity } from './../Entity'
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
 * @public
 */
@Service()
export class LightComponent implements OnUpdate {

  @Inject(Entity)
  public entity: Entity

  public enabled: boolean
  public range: number
  public intensity: number
  public spotAngle: number = Math.PI / 4
  public castShadow: boolean = false
  public position: Vec3
  public direction: Vec3
  public color: Vec3
  public type: LightType

  public readonly params: LightParams

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

  public onUpdate() {
    let t = this.entity.getService(TransformComponent, null)
    if (t) {
      this.direction.x = -t.worldMat.backward[0]
      this.direction.y = -t.worldMat.backward[1]
      this.direction.z = -t.worldMat.backward[2]

      this.position.x = t.worldMat.translation[0]
      this.position.y = t.worldMat.translation[1]
      this.position.z = t.worldMat.translation[2]
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
}
