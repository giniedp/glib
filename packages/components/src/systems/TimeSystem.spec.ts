import { GameEntity } from '@gglib/ecs'
import { TimeSystem } from './TimeSystem'
import { describe, beforeEach, it, expect } from 'vitest'
import { GameLoop } from './GameLoop'

describe('@gglib/ecs/TimeSystem', () => {
  let entity: GameEntity
  let time: TimeSystem
  let loop: GameLoop
  let mockedRealTime = 0

  beforeEach(() => {
    mockedRealTime = 0
    time = new TimeSystem({ getTime: () => mockedRealTime })
    entity = new GameEntity()
    entity.provide(time)
    entity.initialize(null)
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
