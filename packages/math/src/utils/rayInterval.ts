/**
 * Intersects the parameter interval `t` of a ray `origin + t * direction` with slabs and other intervals
 *
 * @internal
 */
export class RayInterval {
  public min = Number.NEGATIVE_INFINITY
  public max = Number.POSITIVE_INFINITY

  public reset(): this {
    this.min = Number.NEGATIVE_INFINITY
    this.max = Number.POSITIVE_INFINITY
    return this
  }

  /**
   * Clips by the slab `lo <= origin + t * direction <= hi`
   *
   * @returns false if the interval became empty
   */
  public clip(origin: number, direction: number, lo: number, hi: number): boolean {
    if (Math.abs(direction) < 1e-12) {
      return origin >= lo && origin <= hi
    }
    let t1 = (lo - origin) / direction
    let t2 = (hi - origin) / direction
    if (t1 > t2) {
      const t = t1
      t1 = t2
      t2 = t
    }
    return this.intersect(t1, t2)
  }

  /**
   * Clips by the interval `[t1, t2]`
   *
   * @returns false if the interval became empty
   */
  public intersect(t1: number, t2: number): boolean {
    this.min = Math.max(this.min, t1)
    this.max = Math.min(this.max, t2)
    return this.min <= this.max
  }

  /**
   * The entry distance, `0` if the ray starts inside, `NaN` if the interval lies behind the ray origin
   */
  public result(): number {
    if (this.max < 0) {
      return Number.NaN
    }
    return Math.max(this.min, 0)
  }
}
