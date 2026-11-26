import type { ResourceNode, ResourceRef } from '@gglib/content'
import type { NodeData } from '@gglib/model'
import { removeItemUnordered } from '@gglib/utils'
import type { GltfAssetContainer } from './asset'
import { EXT_mesh_gpu_instancing, getKhrExtension } from './format/KHR-Extensions'
import { GLTFAccessorBase, loadAccessor } from './load-buffer'

/**
 * The per instance transforms of a node with EXT_mesh_gpu_instancing, local to the node
 */
export interface GltfNodeInstances {
  count: number
  translation: number[][] | null
  rotation: number[][] | null
  scale: number[][] | null
}

/**
 * Reads the instance attributes (TRANSLATION, ROTATION, SCALE) of a node with EXT_mesh_gpu_instancing
 *
 * @param index - index of the node in the document
 */
export function loadNodeInstances(asset: GltfAssetContainer, index: number): ResourceNode<GltfNodeInstances> {
  const graph = asset.graph
  const key = `instances:${index}`
  if (graph.has(key)) {
    return graph.get(key)!
  }
  const ext = getKhrExtension(asset.document.nodes[index], EXT_mesh_gpu_instancing)
  const node = graph.node<GltfNodeInstances>(key, null)
  const refs: Record<string, ResourceRef<GLTFAccessorBase>> = {}
  for (const name of ['TRANSLATION', 'ROTATION', 'SCALE']) {
    const accessor = ext?.attributes?.[name]
    if (accessor != null) {
      refs[name] = graph.dependency(node, loadAccessor(asset, accessor))
    }
  }
  node.build = (_, n, get): GltfNodeInstances => {
    let count = 0
    const read = (name: string, components: number): number[][] | null => {
      if (!refs[name]) {
        return null
      }
      const accessor = get(refs[name])
      count = accessor.attributeCount
      const result: number[][] = []
      for (let i = 0; i < accessor.attributeCount; i++) {
        const value: number[] = []
        for (let c = 0; c < components; c++) {
          // normalized integer rotations are converted to float by the accessor
          value.push(accessor.readComponent(i, c))
        }
        result.push(value)
      }
      return result
    }
    const translation = read('TRANSLATION', 3)
    const rotation = read('ROTATION', 4)
    const scale = read('SCALE', 3)
    return { count, translation, rotation, scale }
  }
  return node
}

/**
 * Turns the instances of a node into child nodes that carry the node's mesh, one per instance with the instance
 * transform as local transform. The node keeps its transform and loses its mesh.
 *
 * @param nodes - the model nodes, the child nodes are appended
 * @param index - index of the instanced node
 * @param meshNodes - the nodes that still wait for their mesh, the child nodes replace the node in it
 */
export function expandNodeInstances(
  nodes: NodeData[],
  index: number,
  instances: GltfNodeInstances,
  meshNodes: NodeData[],
) {
  const source = nodes[index]
  if (source.mesh == null || !instances.count) {
    return
  }
  const children = source.children ? [...source.children] : []
  for (let i = 0; i < instances.count; i++) {
    const child: NodeData = {
      name: source.name,
      mesh: source.mesh,
      extras: source.extras,
    }
    if (instances.translation) {
      child.translation = instances.translation[i]
    }
    if (instances.rotation) {
      child.rotation = instances.rotation[i]
    }
    if (instances.scale) {
      child.scale = instances.scale[i]
    }
    children.push(nodes.length)
    nodes.push(child)
    meshNodes.push(child)
  }
  source.children = children
  removeItemUnordered(meshNodes, source)
  delete source.mesh
}
