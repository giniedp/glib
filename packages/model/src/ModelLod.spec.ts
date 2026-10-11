import { describe, expect, it } from 'vitest'
import type { Model } from './Model'
import { ModelLod } from './ModelLod'

const base = { name: 'lod0' } as Model

function createLod(available: number[]) {
  const requests: number[] = []
  const lod = new ModelLod(base, {
    distance: 10,
    maxLevel: 5,
    load: async (level) => {
      requests.push(level)
      return available.includes(level) ? ({ name: `lod${level}` } as Model) : null
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

  it('keeps the current level within the hysteresis band', () => {
    const { lod } = createLod([])
    // level 1 covers 10..20, widened by 1 on both sides
    expect(lod.select(20.5, 0, 1)).toBe(1)
    expect(lod.select(9.5, 0, 1)).toBe(1)
    expect(lod.select(21.5, 0, 1)).toBe(2)
    expect(lod.select(8.5, 0, 1)).toBe(0)
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
})
