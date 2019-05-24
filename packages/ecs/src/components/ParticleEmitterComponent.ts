import * as Content from '@gglib/content'
import { HttpOptions } from '@gglib/core'
import * as Graphics from '@gglib/graphics'
import { Vec3 } from '@gglib/math'
import { Component } from './../Component'
import { Entity } from './../Entity'
import { ParticleSystemComponent } from './ParticleSystemComponent'
import { TransformComponent } from './TransformComponent'

/**
 * @public
 */
export class ParticleEmitterComponent implements Component {
  /**
   * Name of the component
   */
  public readonly name: string = 'ParticleEmitter'
  public readonly service = false

  /**
   * The entity
   */
  public entity: Entity
  /**
   * The transform component
   */
  public transform: TransformComponent
  /**
   * Number of particles per second
   */
  public frequency: number = 100
  /**
   * The particle channel to emit
   */
  public channel: string
  /**
   * The last position of last emitted particle
   */
  private lastPosition: Vec3 = Vec3.create()
  /**
   * Time that has been left over from previous emit cycle
   */
  private timeFraction: number = 0

  private particleSystem: ParticleSystemComponent
  public setup() {
    this.transform = this.entity.getService('Transform')
    this.lastPosition.initFrom(this.transform.position)
  }

  public update(dt: number) {
    const newPosition = this.transform.position
    const velocity = Vec3.subtract(newPosition, this.lastPosition).multiplyScalar(1.0 / dt)
    const timeStep = 1.0 / this.frequency
    let timeAmount = this.timeFraction + dt
    let timePoint = -this.timeFraction

    while (timeAmount > timeStep) {
      timeAmount -= timeStep
      timePoint += timeStep

      const position = Vec3.lerp(this.lastPosition, newPosition, timePoint / dt)
      this.particleSystem.emit(position, velocity, this.channel)
    }

    this.lastPosition.initFrom(this.transform.position)
  }
}
