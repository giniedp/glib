export function hermite(v1: number, t1: number, v2: number, t2: number, s: number) {
  if (s <= 0) {
    return v1
  }
  if (s >= 1) {
    return v2
  }
  const ss = s * s
  const sss = ss * s
  return (
    (2 * v1 - 2 * v2 + t2 + t1) * sss +
    (3 * v2 - 3 * v1 - 2 * t1 - t2) * ss +
    t1 * s +
    v1
  )
}
