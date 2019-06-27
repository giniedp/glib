/**
 * Applies cosine easing on a value
 *
 * @public
 * @param t - The value
 */
export function easeCosine(t: number): number {
  return (1 - Math.cos(t * Math.PI) * 0.5)
}
