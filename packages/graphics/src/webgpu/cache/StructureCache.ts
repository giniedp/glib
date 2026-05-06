export type CacheTypeMapping<T extends object> = {
  [K in keyof T]: 'weak' | 'map'
}

export interface StructureCache<T extends object, R> {
  get(input: T): R
}

export function structureCache<T extends object, R>({
  shape,
  create,
}: {
  shape: CacheTypeMapping<T>
  create: (input: T) => R
}): StructureCache<T, R> {
  const keys = Object.keys(shape)
  let cache: Map<any, any> | WeakMap<any, any>

  return {
    get: (input: T): R => {
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
        map.set(key, create(input))
      }

      return map.get(key)
    },
  }
}
