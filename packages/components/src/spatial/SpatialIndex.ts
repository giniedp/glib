import { GameEntity, idProvider } from '@gglib/ecs'
import { BoundingBox, BoundingSphere, IntersectionType } from '@gglib/math'
import { idMap, IdMap } from '@gglib/utils'

/**
 * @public
 */
export interface SpatialIndex<T extends object> {
  /**
   * Finds the node that best fits the given volume.
   */
  findFittingNode(volume: BoundingBox): SpatialNode<T>

  /**
   * Traverses the tree and visits all nodes that intersect with the given volume.
   */
  traverseIntersection<V>(
    volume: V,
    check: (volume: V, bounding: BoundingBox) => IntersectionType,
    visit: (node: SpatialNode<T>, intersection: IntersectionType) => void,
  ): void
}

/**
 * @public
 */
export interface SpatialNode<T extends object> {
  bounds: BoundingBox
  data: T
}

export type EntriesPayload = {
  entries: IdMap<number, SpatialEntry<EntriesPayload>>
}

export interface SpatialEntry<T extends EntriesPayload = EntriesPayload> {
  node: SpatialNode<T>
  entity: GameEntity
  box: BoundingBox
  sphere: BoundingSphere
}

const entryIds = idProvider(Symbol('SpatialEntry'))
export function getSpatialEntries(node: SpatialNode<EntriesPayload>): IdMap<number, SpatialEntry> {
  node.data.entries ||= idMap()
  return node.data.entries
}

export function addSpatialEntry(node: SpatialNode<EntriesPayload>, entry: SpatialEntry) {
  const id = entryIds.getOrCreate(entry)
  const entries = getSpatialEntries(node)
  if (entries.has(id)) {
    return false
  }
  entries.set(id, entry)
  return true
}

export function removeSpatialEntry(node: SpatialNode<EntriesPayload>, entry: SpatialEntry) {
  const id = entryIds.getOrCreate(entry)
  return node.data.entries?.delete(id) ?? false
}
