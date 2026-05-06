import { Transform } from '@gglib/math'
import type { NodeData, SkinData } from './Data'
import { Skeleton } from './Skeleton'

export function initTransformNode<T extends Transform>(node: NodeData, transform: T) {
  if (node.translation) {
    transform.translation.initFromArray(node.translation)
  }
  if (node.rotation) {
    transform.rotation.initFromArray(node.rotation)
  }
  if (node.scale) {
    transform.scale.initFromArray(node.scale)
  }
  if (node.matrix) {
    transform.matrix.initFromArray(node.matrix)
    transform.matrix.decompose(transform.scale, transform.rotation, transform.translation)
  }
  transform.markAsChanged()
}

export function initTransformNodes<T extends Transform>(nodes: NodeData[], transforms: T[]) {
  if (nodes.length !== transforms.length) {
    throw new Error(`Expected transforms length to match nodes length, got ${transforms.length} vs ${nodes.length}`)
  }

  for (let i = 0; i < nodes.length; i++) {
    initTransformNode(nodes[i], transforms[i])
    if (!nodes[i].children) {
      continue
    }
    for (const child of nodes[i].children) {
      transforms[i].addChildInLocal(transforms[child])
    }
  }
  return transforms
}

export function createTransformNodes(nodes: NodeData[]): Transform<NodeData>[] {
  const transforms: Transform<NodeData>[] = []
  for (let i = 0; i < nodes.length; i++) {
    transforms[i] = new Transform<NodeData>()
    transforms[i].name = nodes[i].name || ''
    transforms[i].data = nodes[i]
  }
  initTransformNodes(nodes, transforms)
  return transforms
}

export function flattenNodes<T>(nodes: Transform<T>[], output: Transform<T>[] = []) {
  if (!nodes || !nodes.length) {
    return
  }
  for (const node of nodes) {
    output.push(node)
    flattenNodes(node.children, output)
  }
}

export function createSkeletons(skins: SkinData[], transforms: Transform<NodeData>[]) {
  const skeletons: Skeleton[] = []
  if (!skins || !skins.length) {
    return skeletons
  }
  for (const skin of skins) {
    const bones = skin.joints.map((index) => transforms[index])
    const inverse = skin.inverseBindMatrices.map((it) => it.clone())
    skeletons.push(new Skeleton(bones, inverse))
  }
  return skeletons
}
