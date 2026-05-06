import { describe, expect, it } from 'vitest'
import { ResourceGraph } from './ResourceGraph'

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
})
