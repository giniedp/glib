import { GameWorld } from '@gglib/ecs'
import { mat4Identity, SpaceBasis, type Mat4 } from '@gglib/math'
import { CameraData } from '@gglib/render'
import { describe, expect, it, vi } from 'vitest'
import { PriorityLane, ScheduledTask } from './Scheduler'
import { SchedulerSystem } from './SchedulerSystem'

function taskAt(x: number, y: number, z: number): ScheduledTask {
  const world: Mat4 = mat4Identity()
  world[12] = x
  world[13] = y
  world[14] = z
  return { lane: PriorityLane.Medium, entity: { getTransform: () => ({ world }) } as any }
}

function scoresWith(
  basis: SpaceBasis | null,
  positions: Record<string, [number, number, number]>,
  viewAlignment?: number,
) {
  const system = new SchedulerSystem({ viewAlignment })
  system.initialize({ getSystem: () => basis } as unknown as GameWorld)
  const reprioritize = vi.spyOn(system.instance, 'reprioritize').mockImplementation(() => undefined)
  const camera = { world: mat4Identity() } as CameraData

  const scores: Record<string, number> = {}
  for (const [name, [x, y, z]] of Object.entries(positions)) {
    reprioritize.mockClear()
    system.updatePriority(taskAt(x, y, z), camera, 0)
    scores[name] = reprioritize.mock.calls[0][1]
  }
  return scores
}

describe('SchedulerSystem.updatePriority', () => {
  it('prefers tasks in front of the camera in a z up space', () => {
    const scores = scoresWith(SpaceBasis.Z_UP_POS_Y, {
      front: [0, 10, 0],
      side: [10, 0, 0],
      below: [0, 0, -10],
      back: [0, -10, 0],
    })
    expect(scores.front).toBeCloseTo(10)
    expect(scores.side).toBeCloseTo(20)
    // straight down is not the view direction, regression test for reading the local -z axis
    expect(scores.below).toBeCloseTo(20)
    expect(scores.back).toBeCloseTo(30)
  })

  it('falls back to a y up space without a basis system', () => {
    const scores = scoresWith(null, { front: [0, 0, -10], back: [0, 0, 10] })
    expect(scores.front).toBeCloseTo(10)
    expect(scores.back).toBeCloseTo(30)
  })

  it('orders by distance only with a view alignment of 0', () => {
    const scores = scoresWith(SpaceBasis.Z_UP_POS_Y, { front: [0, 10, 0], back: [0, -10, 0], far: [0, 20, 0] }, 0)
    expect(scores.front).toBeCloseTo(10)
    expect(scores.back).toBeCloseTo(10)
    expect(scores.far).toBeCloseTo(20)
  })

  it('weights the view direction by the view alignment', () => {
    const scores = scoresWith(SpaceBasis.Z_UP_POS_Y, { front: [0, 10, 0], back: [0, -10, 0] }, 0.5)
    expect(scores.front).toBeCloseTo(10)
    expect(scores.back).toBeCloseTo(20)
  })
})
