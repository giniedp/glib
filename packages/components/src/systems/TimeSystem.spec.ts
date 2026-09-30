import { GameEntity, GameWorld } from '@gglib/ecs'
import { beforeEach, describe, expect, it } from 'vitest'
import { TimeSystem } from './TimeSystem'

describe('TimeSystem', () => {
  let entity: GameEntity
  let time: TimeSystem
  let realTime = 0

  beforeEach(() => {
    realTime = 0

    const game = new GameWorld()
    game.addSystem(new TimeSystem())
    game.initializeSystems()

    entity = game.createEntity()
    entity.initialize()
    entity.activate()

    time = game.getSystem(TimeSystem)
  })

  it('accumulates game time', () => {
    time.update(realTime, 0.016)
    expect(time.game.delta).toBeCloseTo(0.016)
    expect(time.game.total).toBeCloseTo(0.016)

    time.update(realTime, 0.016)
    expect(time.game.delta).toBeCloseTo(0.016)
    expect(time.game.total).toBeCloseTo(0.032)

    time.update(realTime, 0.008)
    expect(time.game.delta).toBeCloseTo(0.008)
    expect(time.game.total).toBeCloseTo(0.04)

    // draw times are tracked individually

    time.render(realTime, 0.032)
    expect(time.game.delta).toBeCloseTo(0.032)
    expect(time.game.total).toBeCloseTo(0.032)

    time.render(realTime, 0.016)
    expect(time.game.delta).toBeCloseTo(0.016)
    expect(time.game.total).toBeCloseTo(0.048)
  })

  it('accumulates real time', () => {
    realTime = 0.016
    time.update(realTime, 0)
    expect(time.wall.delta).toBeCloseTo(0.016)
    expect(time.wall.total).toBeCloseTo(0.016)

    realTime += 0.016
    time.update(realTime, 0)
    expect(time.wall.delta).toBeCloseTo(0.016)
    expect(time.wall.total).toBeCloseTo(0.032)

    realTime += 0.008
    time.update(realTime, 0)
    expect(time.wall.delta).toBeCloseTo(0.008)
    expect(time.wall.total).toBeCloseTo(0.04)

    // draw times are tracked individually

    time.render(realTime, 0)
    expect(time.wall.delta).toBeCloseTo(0.04)
    expect(time.wall.total).toBeCloseTo(0.04)

    realTime += 0.008
    time.render(realTime, 0)
    expect(time.wall.delta).toBeCloseTo(0.008)
    expect(time.wall.total).toBeCloseTo(0.048)
  })
})
