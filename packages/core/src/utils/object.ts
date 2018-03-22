/**
 * @public
 */
export function isObject(value: any): boolean {
  return value !== null && typeof value === 'object'
}

/**
 * Picks properties from the given source object if they are not undefined
 *
 * @public
 */
export function pick(
  src: any,
  k1?: string,
  k2?: string,
  k3?: string,
  k4?: string,
  k5?: string,
  k6?: string,
  k7?: string,
  k8?: string,
  k9?: string,
  k10?: string,
): any {
  let result: any = {}
  for (let i = 1; i < arguments.length; i += 1) {
    const key = arguments[i]
    const value = src[key]
    if (value !== void 0) {
      result[key] = value
    }
  }
  return result
}

/**
 * Creates a copy of an object, an array or a primitive.
 *
 * @public
 * @returns The copied object
 */
export function copy(srcOrDeep: any, srcOrDest?: any, dest?: any): any {
  let deep = false
  let src: any
  let dst: any
  if (typeof srcOrDeep === 'boolean') {
    deep = srcOrDeep
    src = srcOrDest
    dst = dest
  } else {
    deep = false
    src = srcOrDeep
    dst = srcOrDest
  }

  dst = Array.isArray(src) ? [] : {}

  let value
  let isArray
  let isObj
  for (let key in src) {
    if (src.hasOwnProperty(key)) {
      value = src[key]
      isArray = Array.isArray(value)
      isObj = value != null && typeof value === 'object'

      if (deep && value && (isArray || isObj)) {
        dst[key] = copy(deep, value)
      } else if (value !== void 0) {
        dst[key] = value
      }
    }
  }

  return dst
}

/**
 * Extends the destination object `dst` by copying own enumerable properties from the `src` object(s)
 * to `dst`. You can specify multiple `src` objects. If you want to preserve original objects, you can do so
 * by passing an empty object as the target: `let object = Gin.extend({}, object1, object2)`.
 * Note: Keep in mind that `Gin.extend` does not support recursive merge (deep copy).
 *
 * @public
 * @param dst - Destination object.
 * @param src - Source object(s).
 * @returns Reference to `dst`.
 */
export function extend<T>(dst: T, a: any, b?: any, c?: any, d?: any, e?: any, f?: any): T {
  let length = arguments.length
  if (length < 2 || dst == null) {
    return dst
  }
  let i
  let src
  for (i = 1; i < length; i += 1) {
    src = arguments[i]
    for (let key in src) {
      if (src.hasOwnProperty(key)) {
        (dst as any)[key] = src[key]
      }
    }
  }
  return dst
}
