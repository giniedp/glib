import { Entity, OnAdded, OnInit, OnRemoved, OnUpdate, Component, Inject } from '@gglib/ecs'
import { Vec3 } from '@gglib/math'
import { ParticleSystemComponent } from './ParticleSystemComponent'
import { TransformComponent } from './TransformComponent'

/**
 * @public
 */
@Component({
  install: [
    ParticleSystemComponent,
    TransformComponent
  ]
})
export class ParticleEmitterComponent implements OnInit, OnUpdate {
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

  @Inject(ParticleSystemComponent)
  private readonly particleSystem: ParticleSystemComponent

  @Inject(TransformComponent)
  private readonly transform: TransformComponent

  public onInit() {
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
