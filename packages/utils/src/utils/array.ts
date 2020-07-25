/**
 * Checks whether an object is an array
 *
 * @public
 */
export const isArray = Array.isArray

const concatArray = [].concat

/**
 *
 * @public
 */
export function flattenArray<T>(value: T): T {
  return concatArray.apply([], value || [])
}

export function removeFromList<T>(list: T[], item: T) {
  const index = list.indexOf(item)
  if (index > 0) {
    list.splice(index, 1)
    return true
  }
  return false
}

export function addToList<T>(list: T[], item: T) {
  const index = list.indexOf(item)
  if (index === -1) {
    list.push(item)
    return true
  }
  return false
}

export function append<T>(list: T[] | null, item: T) {
  list = list || []
  list.push(item)
  return list
}
