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

/**
 * @remarks
 * The id is an own property of the type or object. A plain lookup would follow the prototype chain, and a subclass
 * (static inheritance) would get the id of its base class, e.g. every per-scene `SceneComponent.Member` class the id of
 * the shared alias type.
 */
export function idProvider<T extends number, V extends object>(key: symbol): IdProvider<T, V> {
  let nextId = 1
  return {
    getOrCreate(type: V): T {
      if (Object.hasOwn(type, key)) {
        return type[key]
      }
      const newId = nextId++ as T
      type[key] = newId
      return newId
    },
    get(type: V): T | null {
      return Object.hasOwn(type, key) ? type[key] : null
    },
  }
}
