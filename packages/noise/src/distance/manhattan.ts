/**
 * Calculates manhattan distance of a vector
 *
 * @public
 * @param v - The vector
 */
export function manhattanDistance(...v: number[]): number {
  return v.map((x) => x * x).reduce((a, b) => a + b, 0)
}
