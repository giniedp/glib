import { GameComponent, GameEntity } from '@gglib/ecs'
import { Vec3 } from '@gglib/math'
import { GameTransform } from 'ecs/src/GameTransform'
import { GameLoop, LoopTime } from '../systems'
import { ParticleSystemComponent } from './ParticleSystemComponent'

export class ParticleEmitterComponent implements GameComponent {
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

  private get transform() {
    return this.entity.transform
  }

  public entity: GameEntity<GameTransform>

  private loop: GameLoop

  public initialize(entity: GameEntity<GameTransform>): void {
    this.entity = entity
    this.loop = entity.provider.get(GameLoop)
    this.particleSystem = entity.provider.get(ParticleSystemComponent)
  }

  public activate(): void {
    this.lastPosition.initFrom(this.transform.position)
    this.loop.onUpdate.add(this.onUpdate)
  }

  public deactivate(): void {
    this.loop.onUpdate.remove(this.onUpdate)
  }

  public destroy(): void {
    //
  }

  public onUpdate(time: LoopTime) {
    const dt = time.delta
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
