/**
 * Removes the first occurrence of an item from the array while preserving order.
 * Mutates the input array.
 *
 * @returns true if an item was found and removed, otherwise false
 */
export function removeItem<T>(list: T[], item: T) {
  const index = list.indexOf(item)
  if (index >= 0) {
    list.splice(index, 1)
    return true
  }
  return false
}

/**
 * Removes an item from the array without preserving order (swap-with-last removal).
 * This is a constant-time removal but mutates element order.
 * Mutates the input array.
 *
 * @returns true if an item was found and removed, otherwise false
 */
export function removeItemUnordered<T>(list: T[], item: T) {
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
 * Adds an item to the array only if it is not already present.
 * Performs a linear search using indexOf before insertion.
 * Mutates the array.
 */
export function addItemIfAbsent<T>(list: T[], item: T) {
  const index = list.indexOf(item)
  if (index === -1) {
    list.push(item)
    return true
  }
  return false
}

/**
 * Appends an item to the array. If the array is null or undefined,
 * a new array is created and returned.
 */
export function append<T>(list: T[] | null, item: T) {
  list = list || []
  list.push(item)
  return list
}
