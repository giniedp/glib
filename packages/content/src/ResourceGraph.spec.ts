import { describe, expect, it } from 'vitest'
import type { LoadContext } from './ContentLoader'
import { ResourceGraph, type ResourceNode } from './ResourceGraph'

const context = {} as LoadContext

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Records when async builders start and end, and how many run at once
 */
function tracker() {
  const log: string[] = []
  let running = 0
  let maxRunning = 0
  return {
    log,
    get maxRunning() {
      return maxRunning
    },
    async run<T>(key: string, value: T, ms = 10): Promise<T> {
      log.push(`start ${key}`)
      running++
      maxRunning = Math.max(maxRunning, running)
      await delay(ms)
      running--
      log.push(`end ${key}`)
      return value
    },
  }
}

describe('ResourceGraph', () => {
  it('should order dependency first', () => {
    const graph = new ResourceGraph()
    const nodeA = graph.node('a')
    const nodeB = graph.node('b')
    graph.dependency(nodeA, nodeB)

    expect(nodeA.deps.length).toBe(1)
    expect(nodeB.deps.length).toBe(0)

    const order = graph
      .getOrderedSubsetForNode(nodeA)
      .map((n) => n.key)
      .join(',')
    expect(order).toBe('b,a')
  })

  it('builds independent async nodes concurrently', async () => {
    const graph = new ResourceGraph()
    const t = tracker()
    const root = graph.node<string[]>('root')
    const refs = ['a', 'b', 'c'].map((key) => {
      const node = graph.node<string>(key)
      node.buildAsync = () => t.run(key, key)
      return graph.dependency(root, node)
    })
    root.build = (ctx, node, get) => refs.map((ref) => get(ref))

    expect(await graph.load(root, context)).toEqual(['a', 'b', 'c'])
    expect(t.maxRunning).toBe(3)
  })

  it('builds a shared dependency once, before its dependents', async () => {
    const graph = new ResourceGraph()
    const t = tracker()
    let builds = 0
    const shared = graph.node<number>('shared')
    shared.buildAsync = () => {
      builds++
      return t.run('shared', 1)
    }
    const left = graph.node<number>('left')
    const right = graph.node<number>('right')
    const leftRef = graph.dependency(left, shared)
    const rightRef = graph.dependency(right, shared)
    left.buildAsync = (ctx, node, get) => t.run('left', get(leftRef) + 1)
    right.buildAsync = (ctx, node, get) => t.run('right', get(rightRef) + 2)
    const root = graph.node<number>('root')
    const l = graph.dependency(root, left)
    const r = graph.dependency(root, right)
    root.build = (ctx, node, get) => get(l) + get(r)

    expect(await graph.load(root, context)).toBe(5)
    expect(builds).toBe(1)
    expect(t.log.indexOf('end shared')).toBeLessThan(t.log.indexOf('start left'))
    expect(t.log.indexOf('end shared')).toBeLessThan(t.log.indexOf('start right'))
  })

  it('builds a node once across concurrent loads', async () => {
    const graph = new ResourceGraph()
    let builds = 0
    const leaf = graph.node<number>('leaf')
    leaf.buildAsync = async () => {
      builds++
      await delay(10)
      return 7
    }
    const a = graph.node<number>('a')
    const b = graph.node<number>('b')
    const aRef = graph.dependency(a, leaf)
    const bRef = graph.dependency(b, leaf)
    a.build = (ctx, node, get) => get(aRef)
    b.build = (ctx, node, get) => get(bRef)

    expect(await Promise.all([graph.load(a, context), graph.load(b, context)])).toEqual([7, 7])
    expect(builds).toBe(1)
  })

  it('assigns resolved dependencies to the dependent', async () => {
    const graph = new ResourceGraph()
    const texture = graph.node<{ id: string }>('texture')
    texture.buildAsync = async () => {
      await delay(5)
      return { id: 'tex' }
    }
    const material: ResourceNode<{ map?: { id: string } }> = graph.node('material', {})
    graph.assign(material, texture, (target, dep) => {
      target.map = dep
    })

    expect(await graph.load(material, context)).toEqual({ map: { id: 'tex' } })
  })

  it('rejects when a dependency fails', async () => {
    const graph = new ResourceGraph()
    const ok = graph.node<number>('ok')
    ok.buildAsync = async () => {
      await delay(10)
      return 1
    }
    const bad = graph.node<number>('bad')
    bad.buildAsync = async () => {
      throw new Error('broken')
    }
    const root = graph.node<number>('root')
    graph.dependency(root, ok)
    graph.dependency(root, bad)
    root.build = () => 0

    await expect(graph.load(root, context)).rejects.toThrow('broken')
  })

  it('does not build nodes after the load was aborted', async () => {
    const graph = new ResourceGraph()
    const controller = new AbortController()
    let built = false
    const leaf = graph.node<number>('leaf')
    leaf.buildAsync = async () => {
      await delay(5)
      controller.abort()
      return 1
    }
    const root = graph.node<number>('root')
    graph.dependency(root, leaf)
    root.buildAsync = async () => {
      built = true
      return 2
    }

    await expect(graph.load(root, { signal: controller.signal } as LoadContext)).rejects.toThrow()
    expect(built).toBe(false)
  })
})
