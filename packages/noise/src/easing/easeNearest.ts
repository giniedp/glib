/**
 * Return either `0` or `1`
 *
 * @public
 * @param t - The value
 */
export function easeNearest(t: number): number {
  return t < 0.5 ? 0 : 1
}
