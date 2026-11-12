import { ResourceOwnership } from '@gglib/graphics'
import { describe, expect, it } from 'vitest'
import type { Model } from './Model'
import { ModelLod } from './ModelLod'

function fakeModel(name: string): Model {
  const model = { name } as { name: string; ownership: ResourceOwnership }
  model.ownership = new ResourceOwnership(model)
  return model as unknown as Model
}

const base = fakeModel('lod0')

function createLod(available: number[]) {
  const requests: number[] = []
  const lod = new ModelLod(base, {
    distance: 10,
    maxLevel: 5,
    load: async (level) => {
      requests.push(level)
      return available.includes(level) ? fakeModel(`lod${level}`) : null
    },
  })
  return { lod, requests }
}

describe('ModelLod', () => {
  it('selects level n from n * distance on', () => {
    const { lod } = createLod([])
    expect(lod.select(0, 0, 0)).toBe(0)
    expect(lod.select(9, 0, 0)).toBe(0)
    expect(lod.select(25, 0, 0)).toBe(2)
    expect(lod.select(1000, 0, 0)).toBe(5)
  })

  it('selects the forced level regardless of the distance, within the max level', () => {
    const { lod } = createLod([])
    lod.forcedLevel = 2
    expect(lod.select(0, 1, 0)).toBe(2)
    expect(lod.select(1000, 0, 5)).toBe(2)
    lod.forcedLevel = 9
    expect(lod.select(0, 0, 0)).toBe(5)
    lod.forcedLevel = null
    expect(lod.select(1000, 0, 0)).toBe(5)
  })

  it('keeps the current level within the hysteresis band', () => {
    const { lod } = createLod([])
    // level 1 covers 10..20, widened by 1 on both sides
    expect(lod.select(20.5, 0, 1)).toBe(1)
    expect(lod.select(9.5, 0, 1)).toBe(1)
    expect(lod.select(21.5, 0, 1)).toBe(2)
    expect(lod.select(8.5, 0, 1)).toBe(0)
  })

  it('doubles the switch distance per level with doubling spacing', () => {
    const lod = new ModelLod(base, { distance: 10, maxLevel: 5, spacing: 'doubling', load: async () => null })
    // level 1 from 10, 2 from 20, 3 from 40, 4 from 80, 5 from 160
    expect(lod.select(9, 0, 0)).toBe(0)
    // 10 is still within the hysteresis of level 0 (up to 11)
    expect(lod.select(10, 0, 0)).toBe(0)
    expect(lod.select(11.5, 0, 0)).toBe(1)
    expect(lod.select(19, 0, 0)).toBe(1)
    expect(lod.select(39, 0, 0)).toBe(2)
    expect(lod.select(40, 0, 0)).toBe(3)
    expect(lod.select(159, 0, 0)).toBe(4)
    expect(lod.select(160, 0, 0)).toBe(5)
    expect(lod.select(10000, 0, 0)).toBe(5)
  })

  it('widens the doubling ranges by the hysteresis of the neighbouring levels', () => {
    const lod = new ModelLod(base, { distance: 10, maxLevel: 5, spacing: 'doubling', load: async () => null })
    // level 2 covers 20..40, widened below by 0.1 of level 1 (10) and above by 0.1 of its own range (20)
    expect(lod.select(19.5, 0, 2)).toBe(2)
    expect(lod.select(18.5, 0, 2)).toBe(1)
    expect(lod.select(41.5, 0, 2)).toBe(2)
    expect(lod.select(42.5, 0, 2)).toBe(3)
  })

  it('keeps finer levels while the model is large on screen', () => {
    const { lod } = createLod([])
    lod.maxScreenSize = [-1, 0.6, 0.4, 0.2]
    // the distance alone selects level 3
    expect(lod.select(35, 0.1, 0)).toBe(3)
    expect(lod.select(35, 0.3, 0)).toBe(2)
    expect(lod.select(35, 0.5, 0)).toBe(1)
    expect(lod.select(35, 0.7, 0)).toBe(0)
  })

  it('shows the closest finer level while the wanted level loads', async () => {
    const { lod, requests } = createLod([1, 2])
    expect(lod.resolve(2)).toBe(0)
    expect(requests).toEqual([2])
    await Promise.resolve()
    await Promise.resolve()
    expect(lod.resolve(2)).toBe(2)
    expect(lod.getModel(2).name).toBe('lod2')
  })

  it('lowers the max level when a level does not exist', async () => {
    const { lod, requests } = createLod([1])
    lod.resolve(3)
    await Promise.resolve()
    await Promise.resolve()
    expect(lod.maxLevel).toBe(2)
    expect(lod.select(1000, 0, 0)).toBe(2)
    // a failed level is not requested again
    lod.resolve(3)
    expect(requests).toEqual([3])
  })

  it('makes the base model own the loaded levels', async () => {
    const owner = fakeModel('base')
    const lod = new ModelLod(owner, { distance: 10, maxLevel: 1, load: async () => fakeModel('lod1') })
    lod.resolve(1)
    await new Promise((resolve) => setTimeout(resolve))
    const level = lod.getModel(1)
    expect(Array.from(owner.ownership.children)).toEqual([level])
    owner.ownership.finalize()
    expect(level.ownership.isFinalized).toBe(true)
  })

  it('disposes levels that finish loading after the base model is gone', async () => {
    const owner = fakeModel('base')
    const loaded = fakeModel('lod1')
    ;(loaded as any).dispose = () => loaded.ownership.finalize()
    const lod = new ModelLod(owner, { distance: 10, maxLevel: 1, load: async () => loaded })
    lod.resolve(1)
    owner.ownership.finalize()
    await new Promise((resolve) => setTimeout(resolve))
    expect(lod.getModel(1)).toBe(null)
    expect(loaded.ownership.isFinalized).toBe(true)
  })
})
