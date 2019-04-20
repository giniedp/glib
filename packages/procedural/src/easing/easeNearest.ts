export function easeNearest(t: number): number {
  return t < 0.5 ? 0 : 1
}
