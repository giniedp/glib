export interface IdSet<ID extends number | string = number> extends Iterable<ID> {
  readonly size: number
  readonly values: ReadonlyArray<ID>
  add(id: ID): void
  clear(): void
  delete(id: ID): void
  has(id: ID): boolean
  indexOf(id: ID): number
}

export function idSet<ID extends number | string = number>(): IdSet<ID> {
  const values: ID[] = []
  const mapToIndex = new Map<ID, number>()
  let size = 0

  return {
    [Symbol.iterator]: () => values[Symbol.iterator](),
    get size() {
      return size
    },
    get values(): ReadonlyArray<ID> {
      return values
    },
    add(id: ID) {
      if (!mapToIndex.has(id)) {
        mapToIndex.set(id, size)
        values[size++] = id
      }
    },
    clear() {
      size = 0
      values.length = 0
      mapToIndex.clear()
    },
    has(id: ID): boolean {
      return mapToIndex.has(id)
    },
    indexOf(id: ID): number {
      return mapToIndex.get(id) ?? -1
    },
    delete(id: ID) {
      const index = mapToIndex.get(id)
      if (index == null || index >= size) {
        return
      }
      const lastIndex = --size
      const last = values[lastIndex]
      if (index !== lastIndex) {
        values[index] = last
        mapToIndex.set(last, index)
      }

      values.length = size
      mapToIndex.delete(id)
    },
  }
}
