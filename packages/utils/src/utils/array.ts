/**
 * Checks whether an object is an array
 *
 * @public
 */
export const isArray = Array.isArray

/**
 *
 * @param v Checks whether an object is an ArrayBufferView
 */
export function isArrayBufferView(v: any): v is ArrayBufferView {
  const it = v as ArrayBufferView
  return it != null && it.buffer != null && it.byteLength != null && it.byteOffset != null
}

const concatArray = [].concat

/**
 *
 * @public
 */
export function flattenArray<T>(value: T[][]): T[] {
  return concatArray.apply([], value || [])
}

/**
 * Removes an item from given array
 *
 * @param list
 * @param item
 */
export function removeFromArray<T>(list: T[], item: T) {
  const index = list.indexOf(item)
  if (index >= 0) {
    list.splice(index, 1)
    return true
  }
  return false
}

/**
 * Adds an item to given array but only if it is not already included
 *
 * @param set - the array
 * @param item - the item
 */
export function addToArraySet<T>(set: T[], item: T) {
  const index = set.indexOf(item)
  if (index === -1) {
    set.push(item)
    return true
  }
  return false
}

/**
 * Pushes an item into the given array. If array is null, a new instance is created
 *
 * @param list - the array
 * @param item - the item
 * @returns the given array or a new instance
 */
export function append<T>(list: T[] | null, item: T) {
  list = list || []
  list.push(item)
  return list
}
