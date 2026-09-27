export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export function normalize(value: number, start: number, end: number) {
  return (value - start) / (end - start)
}

export function remap(value: number, fromStart: number, fromEnd: number, toStart: number, toEnd: number) {
  return lerp(toStart, toEnd, normalize(value, fromStart, fromEnd))
}

export function wrap(value: number, min: number, max: number) {
  return value - (max - min) * Math.floor(normalize(value, min, max))
}

export function smooth(t: number): number {
  t = t > 1 ? 1 : t < 0 ? 0 : t
  t = t * t * (3 - 2 * t)
  return t
}

export function hermite(v1: number, t1: number, v2: number, t2: number, s: number) {
  if (s <= 0) {
    return v1
  }
  if (s >= 1) {
    return v2
  }
  const ss = s * s
  const sss = ss * s
  return (2 * v1 - 2 * v2 + t2 + t1) * sss + (3 * v2 - 3 * v1 - 2 * t1 - t2) * ss + t1 * s + v1
}

export function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

export function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1.0 / 2.4) - 0.055
}

// #region easing
export function easeLinear(t: number) {
  return t
}

export function easeInQuad(t: number) {
  return t * t
}

export function easeOutQuad(t: number) {
  return t * (2 - t)
}

export function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

export function easeInCubic(t: number) {
  return t * t * t
}

export function easeOutCubic(t: number) {
  return --t * t * t + 1
}

export function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
}

export function easeInQuart(t: number) {
  return t * t * t * t
}

export function easeOutQuart(t: number) {
  return 1 - --t * t * t * t
}

export function easeInOutQuart(t: number) {
  return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t
}

export function easeInQuint(t: number) {
  return t * t * t * t * t
}

export function easeOutQuint(t: number) {
  return 1 + --t * t * t * t * t
}

export function easeInOutQuint(t: number) {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t
}
// #endregion

// #region time
export const MS_TO_SEC = 1 / 1000
export const SEC_TO_MS = 1000

export function msToSec(value: number) {
  return value * MS_TO_SEC
}

export function secToMs(value: number) {
  return value * SEC_TO_MS
}
// #endregion

// #region angle
export const RAD_TO_DEGREE = 180 / Math.PI
export const DEGREE_TO_RAD = Math.PI / 180

export function toDegrees(radians: number) {
  return radians * RAD_TO_DEGREE
}

export function toRadians(degrees: number) {
  return degrees * DEGREE_TO_RAD
}
// #endregion
