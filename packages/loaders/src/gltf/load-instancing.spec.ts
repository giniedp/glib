import type { NodeData } from '@gglib/model'
import { describe, expect, it } from 'vitest'
import { expandNodeInstances } from './load-instancing'

describe('glTF EXT_mesh_gpu_instancing', () => {
  it('turns the instances into child nodes with the mesh', () => {
    const nodes: NodeData[] = [
      { name: 'root', children: [1] },
      { name: 'planks', mesh: 3, translation: [1, 2, 3], children: [2], extras: { sid: 7 } },
      { name: 'child' },
    ]
    const meshNodes = [nodes[1]]
    expandNodeInstances(
      nodes,
      1,
      {
        count: 2,
        translation: [
          [1, 0, 0],
          [2, 0, 0],
        ],
        rotation: [
          [0, 0, 0, 1],
          [0, 1, 0, 0],
        ],
        scale: null,
      },
      meshNodes,
    )

    expect(nodes.length).toBe(5)
    // the node keeps its transform and children, its mesh moves to the instances
    expect(nodes[1].mesh).toBeUndefined()
    expect(nodes[1].translation).toEqual([1, 2, 3])
    expect(nodes[1].children).toEqual([2, 3, 4])
    expect(nodes[3]).toEqual({
      name: 'planks',
      mesh: 3,
      extras: { sid: 7 },
      translation: [1, 0, 0],
      rotation: [0, 0, 0, 1],
    })
    expect(nodes[4]).toEqual({
      name: 'planks',
      mesh: 3,
      extras: { sid: 7 },
      translation: [2, 0, 0],
      rotation: [0, 1, 0, 0],
    })
    // in any order
    expect(meshNodes).toHaveLength(2)
    expect(meshNodes).toContain(nodes[3])
    expect(meshNodes).toContain(nodes[4])
  })

  it('keeps a node without instances', () => {
    const nodes: NodeData[] = [{ name: 'planks', mesh: 0 }]
    const meshNodes = [nodes[0]]
    expandNodeInstances(nodes, 0, { count: 0, translation: null, rotation: null, scale: null }, meshNodes)
    expect(nodes).toEqual([{ name: 'planks', mesh: 0 }])
    expect(meshNodes).toEqual([nodes[0]])
  })
})
