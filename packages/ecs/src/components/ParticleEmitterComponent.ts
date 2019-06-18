import { Vec3 } from '@gglib/math'
import { OnAdded, OnInit, OnRemoved, OnUpdate } from './../Component'
import { Entity } from './../Entity'
import { ParticleSystemComponent } from './ParticleSystemComponent'
import { TransformComponent } from './TransformComponent'

/**
 * @public
 */
export class ParticleEmitterComponent implements OnAdded, OnRemoved, OnInit, OnUpdate {

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
  private transform: TransformComponent

  public onAdded(entity: Entity) {
    entity.addService(ParticleEmitterComponent, this)
  }

  public onRemoved(entity: Entity) {
    entity.removeService(ParticleEmitterComponent)
  }

  public onInit(entity: Entity) {
    this.particleSystem = entity.getService(ParticleSystemComponent)
    this.transform = entity.getService(TransformComponent)
    this.lastPosition.initFrom(this.transform.position)
  }

  public onUpdate(dt: number) {
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
