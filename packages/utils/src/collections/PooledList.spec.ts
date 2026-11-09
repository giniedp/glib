import { describe, expect, it } from 'vitest'
import { PooledList } from './PooledList'

describe('@gglib/utils/PooledList', () => {
  it('reuses items after clear', () => {
    let created = 0
    const list = new PooledList(() => ({ id: created++ }))
    const a = list.next()
    const b = list.next()
    list.clear()
    expect(list.size).toBe(0)
    expect(list.next()).toBe(a)
    expect(list.next()).toBe(b)
    expect(list.next().id).toBe(2)
    expect(created).toBe(3)
  })

  it('hands out the next available item without a factory', () => {
    const list = new PooledList<{ v: number }>()
    expect(list.nextAvailable()).toBe(null)
    const a = { v: 1 }
    list.push(a)
    list.clear()
    expect(list.nextAvailable()).toBe(a)
    expect(list.size).toBe(0)
    list.push(list.nextAvailable())
    expect(list.item(0)).toBe(a)
  })
})
