import { GameComponent, GameEntity, InitializableComponent } from '@gglib/ecs'
import { Vec3 } from '@gglib/math'
import { BehaviorComponent } from '../systems/BehaviorSystem'
import { TransformComponent } from './TransformComponent'

export class ParticleEmitterComponent implements GameComponent, InitializableComponent, BehaviorComponent {
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

  // private particleSystem: ParticleSystemComponent

  private transform: TransformComponent

  public readonly entity: GameEntity

  public initialize(): void {
    this.transform = this.entity.component(TransformComponent)
    // this.particleSystem = this.entity.service(ParticleSystemComponent)
  }

  public activate(): void {
    this.lastPosition.initFrom(this.transform.translation)
  }

  public deactivate(): void {
    //
  }

  public destroy(): void {
    //
  }

  public updateBehavior(time: number, dt: number): void {
    const newPosition = this.transform.translation
    const velocity = Vec3.subtract(newPosition, this.lastPosition).multiplyScalar(1.0 / dt)
    const timeStep = 1.0 / this.frequency
    let timeAmount = this.timeFraction + dt
    let timePoint = -this.timeFraction

    while (timeAmount > timeStep) {
      timeAmount -= timeStep
      timePoint += timeStep

      const position = Vec3.lerp(this.lastPosition, newPosition, timePoint / dt)
      // this.particleSystem.emit(position, velocity, this.channel)
    }

    this.lastPosition.initFrom(this.transform.translation)
  }
}
