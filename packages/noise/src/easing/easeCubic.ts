/**
 * Applies cubic easing on a value
 *
 * @public
 * @param t - The value
 */
export function easeCubic(t: number): number {
  return t * t * (3 - 2 * t)
}
