import { hasOwnProperty } from './hasOwnProperty'

/**
 * Checks whether a value is of type 'object' and is not an array or null
 *
 * @public
 */
export function isObject(value: any): value is object {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Picks properties from the given source object if they are not undefined
 *
 * @public
 */
export function pick<T>(src: T, ...rest: string[]): Partial<T> {
  let result: Partial<T> = {}
  for (let i = 1; i < arguments.length; i += 1) {
    const key = arguments[i]
    const value = src[key]
    if (value !== void 0) {
      result[key] = value
    }
  }
  return result
}

export function copy<T>(src?: T[], dest?: T[]): T[]
export function copy<T>(src?: T, dest?: T): T
export function copy<T>(srcOrDeep: boolean, srcOrDest?: T[], dest?: T[]): T[]
export function copy<T>(srcOrDeep: boolean, srcOrDest?: T, dest?: Partial<T>): T
/**
 * Creates a copy of an object, an array or a primitive.
 *
 * @public
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
    if (hasOwnProperty(src, key)) {
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
 * Extends the first argument with properties of all latter arguments
 *
 * @public
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
      if (hasOwnProperty(src, key)) {
        (dst as any)[key] = src[key]
      }
    }
  }
  return dst
}
