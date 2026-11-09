import { GameWorld, type GameComponent, type GameEntity } from '@gglib/ecs'
import { beforeEach, describe, expect, it } from 'vitest'
import { BehaviorOrder, BehaviorSystem, type BehaviorComponent } from './BehaviorSystem'

class Recorder implements GameComponent, BehaviorComponent {
  public readonly entity: GameEntity
  public constructor(
    private name: string,
    private log: string[],
    public readonly behaviorOrder?: number,
  ) {}
  public updateBehavior(): void {
    this.log.push(this.name)
  }
}

// an entity holds one component per type
class LateRecorder extends Recorder {}

describe('BehaviorSystem', () => {
  let world: GameWorld
  let system: BehaviorSystem
  let log: string[]

  beforeEach(() => {
    log = []
    world = new GameWorld()
    world.addSystem(new BehaviorSystem())
    world.initializeSystems()
    system = world.getSystem(BehaviorSystem)
  })

  function spawn(...components: GameComponent[]) {
    const entity = world.createEntity({ components })
    entity.initialize()
    entity.activate()
    return entity
  }

  it('runs lower orders first, equal orders in activation order', () => {
    spawn(new LateRecorder('camera', log, BehaviorOrder.Late), new Recorder('controller', log))
    spawn(new Recorder('second', log))
    system.update(0, 0)
    expect(log).toEqual(['controller', 'second', 'camera'])
  })

  it('resorts after activation and skips deactivated components', () => {
    spawn(new Recorder('camera', log, BehaviorOrder.Late))
    const entity = spawn(new Recorder('a', log))
    system.update(0, 0)
    log.length = 0

    entity.deactivate()
    spawn(new Recorder('b', log, -1))
    system.update(0, 0)
    expect(log).toEqual(['b', 'camera'])
  })
})
