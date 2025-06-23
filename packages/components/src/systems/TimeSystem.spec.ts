import { GameEntity, GameProvider } from '@gglib/ecs'
import { beforeEach, describe, expect, it } from 'vitest'
import { createEntity } from '../components/createGame'
import { GameLoop } from './GameLoop'
import { TimeSystem } from './TimeSystem'

describe('TimeSystem', () => {
  let entity: GameEntity
  let time: TimeSystem
  let loop: GameLoop
  let mockedRealTime = 0

  beforeEach(() => {
    mockedRealTime = 0

    const provider = new GameProvider()
    provider.addSystem(new TimeSystem())
    provider.provide(
      new GameLoop({
        getTime: () => mockedRealTime,
      }),
    )
    provider.initialize()

    entity = createEntity({})
    entity.initialize(provider)
    entity.activate()

    time = provider.get(TimeSystem)
    loop = provider.get(GameLoop)
  })

  it('accumulates game time', () => {
    time.onUpdate({ deltaMs: 16 } as any)
    expect(time.game.elapsedMs).toBe(16)
    expect(time.game.totalMs).toBe(16)

    time.onUpdate({ deltaMs: 16 } as any)
    expect(time.game.elapsedMs).toBe(16)
    expect(time.game.totalMs).toBe(32)

    time.onUpdate({ deltaMs: 8 } as any)
    expect(time.game.elapsedMs).toBe(8)
    expect(time.game.totalMs).toBe(40)

    // draw times are tracked individually

    time.onDraw({ deltaMs: 32 } as any)
    expect(time.game.elapsedMs).toBe(32)
    expect(time.game.totalMs).toBe(32)

    time.onDraw({ deltaMs: 16 } as any)
    expect(time.game.elapsedMs).toBe(16)
    expect(time.game.totalMs).toBe(48)
  })

  it('accumulates real time', () => {
    mockedRealTime = 16
    time.onUpdate({ deltaMs: 0 } as any)
    expect(time.wall.elapsedMs).toBe(16)
    expect(time.wall.totalMs).toBe(16)

    mockedRealTime += 16
    time.onUpdate({ deltaMs: 0 } as any)
    expect(time.wall.elapsedMs).toBe(16)
    expect(time.wall.totalMs).toBe(32)

    mockedRealTime += 8
    time.onUpdate({ deltaMs: 0 } as any)
    expect(time.wall.elapsedMs).toBe(8)
    expect(time.wall.totalMs).toBe(40)

    // draw times are tracked individually

    time.onDraw({ deltaMs: 0 } as any)
    expect(time.wall.elapsedMs).toBe(40)
    expect(time.wall.totalMs).toBe(40)

    mockedRealTime += 8
    time.onDraw({ deltaMs: 0 } as any)
    expect(time.wall.elapsedMs).toBe(8)
    expect(time.wall.totalMs).toBe(48)
  })
})
