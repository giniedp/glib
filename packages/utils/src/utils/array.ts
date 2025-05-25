/**
 * Removes an item from given array
 *
 * @remarks
 * This will splice the array at the index of the.
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
 * Removes an item from given array by swapping it with the last item
 * and reducing the array size by one
 *
 * @remarks
 * This is a garbage free operation but the order of the array is not preserved
 * @returns true if the item was found and removed
 */
export function removeFromArrayUnstable<T>(list: T[], item: T) {
  const index = list.indexOf(item)
  if (index < 0) {
    return false
  }
  if (index !== list.length - 1) {
    list[index] = list[list.length - 1]
  }
  list.length--
  return true
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
