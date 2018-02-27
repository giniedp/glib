export const isArray = Array.isArray

const concatArray = [].concat
export function flattenArray<T>(value: T): T {
  return concatArray.apply([], value || [])
}
