/**
 * Flips the winding order of given indices
 *
 * @public
 * @remarks indices are assumed to define a triangle list
 */
export function flipWindingOrder(indices: number[]) {
  for (let i = 0; i < indices.length - 2; i += 3) {
    const tmp = indices[i + 1]
    indices[i + 1] = indices[i + 2]
    indices[i + 2] = tmp
  }
}
