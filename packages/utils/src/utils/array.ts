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
