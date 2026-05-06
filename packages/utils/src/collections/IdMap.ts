export interface IdMap<ID extends number | string = number, V = unknown> {
  readonly size: number
  readonly keys: ReadonlyArray<ID>
  readonly values: ReadonlyArray<V>
  set(id: ID, value: V): this
  get(id: ID): V | undefined
  clear(): void
  delete(id: ID): boolean
  has(id: ID): boolean
  indexOf(id: ID): number
}

export function idMap<ID extends number | string = number, V = unknown>(): IdMap<ID, V> {
  const keys: ID[] = []
  const values: V[] = []
  const mapToIndex = new Map<ID, number>()
  let size = 0

  return {
    get size() {
      return size
    },
    get keys(): ReadonlyArray<ID> {
      return keys
    },
    get values(): ReadonlyArray<V> {
      return values
    },
    set(id: ID, value: V) {
      if (!mapToIndex.has(id)) {
        mapToIndex.set(id, size)
        keys[size] = id
        values[size] = value
        size++
      } else {
        values[mapToIndex.get(id)!] = value
      }
      return this
    },
    get(id: ID): V {
      return values[mapToIndex.get(id)]
    },
    clear(): void {
      size = 0
      keys.length = 0
      values.length = 0
      mapToIndex.clear()
    },
    has(id: ID): boolean {
      return mapToIndex.has(id)
    },
    indexOf(id: ID): number {
      return mapToIndex.get(id) ?? -1
    },
    delete(id: ID): boolean {
      const index = mapToIndex.get(id)
      if (index == null || index >= size) {
        return false
      }
      const lastIndex = --size
      const lastKey = keys[lastIndex]
      if (index !== lastIndex) {
        keys[index] = lastKey
        values[index] = values[lastIndex]
        mapToIndex.set(lastKey, index)
      }

      keys.length = size
      values.length = size
      mapToIndex.delete(id)
      return true
    },
  }
}
