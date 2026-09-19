export function smooth(t: number): number {
  t = t > 1 ? 1 : t < 0 ? 0 : t
  t = t * t * (3 - 2 * t)
  return t
}
