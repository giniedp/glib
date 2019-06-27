/**
 * Applies quintic easing on a value (simply returns the value)
 *
 * @public
 * @param t - The value
 */
export function easeQuintic(t: number): number {
  const t3 = t * t * t
  const t4 = t3 * t
  const t5 = t4 * t
  return 6 * t5 - 15 * t4 + 10 * t3
}
