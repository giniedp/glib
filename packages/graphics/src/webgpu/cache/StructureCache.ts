export type CacheTypeMapping<T extends object> = {
  [K in keyof T]: 'weak' | 'map'
}

export interface StructureCache<T extends object, R> {
  /**
   * Returns a promise that resolves when the value is read.
   */
  ready(input: T): Promise<R>

  /**
   * Returns the value if it is already loaded, otherwise returns null.
   */
  get(input: T): R | null
}

export function structureCache<T extends object, R>({
  shape,
  create,
}: {
  shape: CacheTypeMapping<T>
  create: (input: T) => R | Promise<R>
}): StructureCache<T, R> {
  const keys = Object.keys(shape)
  let cache: Map<any, any> | WeakMap<any, any>

  function get(input: T): R | Promise<R> {
    if (!cache) {
      cache = shape[keys[0]] === 'weak' ? new WeakMap() : new Map()
    }
    let map = cache
    let key: any
    for (let i = 0; i < keys.length - 1; i++) {
      key = input[keys[i]]
      if (map.has(key)) {
        map = map.get(key)
      } else {
        // console.log('cache miss on key:', keys[i], key)
        const newMap = shape[keys[i + 1]] === 'weak' ? new WeakMap() : new Map()
        map.set(key, newMap)
        map = newMap
      }
    }
    key = input[keys[keys.length - 1]]
    if (!map.has(key)) {
      storeValue(map, key, create(input))
    }
    return map.get(key)
  }

  return {
    ready: async (input: T): Promise<R> => {
      return get(input)
    },
    get: (input: T): R => {
      const result = get(input)
      if (!isPromiseLike(result)) {
        return result
      }
      // still being loaded
      return null
    },
  }
}

function isPromiseLike<T>(obj: any): obj is Promise<T> {
  return obj && typeof obj.then === 'function'
}
function storeValue(map: Map<any, any> | WeakMap<any, any>, key: any, value: any) {
  map.set(key, value)
  if (isPromiseLike(value)) {
    value.then((resolvedValue) => {
      map.set(key, resolvedValue)
    })
  }
}
