/**
 * Calculates euclidean distance of a vector
 *
 * @public
 * @param v - The vector
 */
export function euclideanDistance(...v: number[]): number {
  return v.map((x) => x * x).reduce((a, b) => a + b, 0)
}
