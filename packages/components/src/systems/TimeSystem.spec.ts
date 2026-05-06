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
    time.update(realTime, 16)
    expect(time.game.elapsedMs).toBe(16)
    expect(time.game.totalMs).toBe(16)

    time.update(realTime, 16)
    expect(time.game.elapsedMs).toBe(16)
    expect(time.game.totalMs).toBe(32)

    time.update(realTime, 8)
    expect(time.game.elapsedMs).toBe(8)
    expect(time.game.totalMs).toBe(40)

    // draw times are tracked individually

    time.update(realTime, 32)
    expect(time.game.elapsedMs).toBe(32)
    expect(time.game.totalMs).toBe(32)

    time.update(realTime, 16)
    expect(time.game.elapsedMs).toBe(16)
    expect(time.game.totalMs).toBe(48)
  })

  it('accumulates real time', () => {
    realTime = 16
    time.update(realTime, 0)
    expect(time.wall.elapsedMs).toBe(16)
    expect(time.wall.totalMs).toBe(16)

    realTime += 16
    time.update(realTime, 0)
    expect(time.wall.elapsedMs).toBe(16)
    expect(time.wall.totalMs).toBe(32)

    realTime += 8
    time.update(realTime, 0)
    expect(time.wall.elapsedMs).toBe(8)
    expect(time.wall.totalMs).toBe(40)

    // draw times are tracked individually

    time.update(realTime, 0)
    expect(time.wall.elapsedMs).toBe(40)
    expect(time.wall.totalMs).toBe(40)

    realTime += 8
    time.update(realTime, 0)
    expect(time.wall.elapsedMs).toBe(8)
    expect(time.wall.totalMs).toBe(48)
  })
})
