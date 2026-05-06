export type NotPrimitive<T> = T extends number | string | boolean | symbol | bigint | null | undefined ? never : T

export interface IdProvider<T extends number, V extends object> {
  /**
   * Returns the ID for the given type or object, creating a new one if the type does not have an ID yet.
   */
  getOrCreate(type: NotPrimitive<V>): T
  /**
   * Returns the ID for the given type or object, or null if the type does not have an ID yet.
   */
  get(type: NotPrimitive<V>): T | null
}

export function idProvider<T extends number, V extends object>(key: symbol): IdProvider<T, V> {
  let nextId = 1
  return {
    getOrCreate(type: V): T {
      if (type[key]) {
        return type[key]
      }
      const newId = nextId++ as T
      type[key] = newId
      return newId
    },
    get(type: V): T | null {
      return type[key] ?? null
    },
  }
}
