import { constant } from './operator/constant'
import { Sampler } from './types'



export function samplerArray(...src: Array<Sampler | number>): Sampler[] {
  return src.map(sampler)
}

export function sampler(src: Sampler | number): Sampler {
  return typeof(src) === 'number' ? constant(src) : src
}

export enum NeighboringType {
  /**
   * Specifies the moore neighborhood.
   *
   * @remarks
   * In a 2d grid this are all 8 points around a central cell.
   */
  Moore,

  /**
   * Specifies the von Neumann neighborhood.
   *
   * @remarks
   * In a 2d grid this are the 4 points on the vertical and horizontal axis around a central cell.
   */
  Neumann,

  /**
   * Specifies the rotated von Neumann neighborhood.
   *
   * @remarks
   * In a 2d grid this are the 4 points laying on the diagonal corners around a central cell.
   */
  NeumannRotated,
}

/**
 * Creates an array with relative index offsets for a point in a 2 dimensional
 * grid (heightmap) to its neighboring points.
 *
 * @param width - The width of the 2 dimensional grid
 * @param neighboring - The neighbor type to be used
 */
export function neighborOffsets(width: number, neighboring: NeighboringType): number[] {
  let w = width
  switch (neighboring) {
    case NeighboringType.Moore:
        return [-w - 1, -w, -w + 1, -1, +1, w - 1, w, w + 1]
    case NeighboringType.Neumann:
        return [-w, 1, w, -1]
    case NeighboringType.NeumannRotated:
        return [-w - 1, -w + 1, w - 1, w + 1]
    default:
        throw new Error(`not implemented ${neighboring}`)
  }
}

export function floor(value: number): number {
  return value >= 0 ? value | 0 : value | 0 - 1
}

export function abs(value: number): number {
  return value < 0 ? -value : value
}

export function distance(v1: number, v2: number): number {
  const c = v2 - v1
  return c < 0 ? -c : c
}

export function step(threshold: number, value: number): number {
  return value >= threshold ? 1 : 0
}

export function pulse(left: number, right: number, value: number): number {
  return step(left, value) - step(right, value)
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return value < minimum ? minimum : (value > maximum ? maximum : value)
}

export function min(a: number, b: number): number {
  return a < b ? a : b
}

export function max(a: number, b: number): number {
  return a > b ? a : b
}

export function mod(a: number, b: number): number {
  a -= ((a / b) * b) | 0
  return (a < 0 ? a + b : a)
}

export function smoothStep(left: number, right: number, value: number, minimum = 0, maximum = 1): number {
  if (value < left) {
      return minimum
  }
  if (value >= right) {
      return maximum
  }
  value = (value - left) / (right - left)
  return (value * value * (3 - 2 * value))
}

export function lerp(v1: number, v2: number, t: number): number {
  return (1.0 - t) * v1 + v2 * t
}

export function gamma(g: number, value: number): number {
  return Math.pow(value, 1 / g)
}

export function bias(b: number, value: number): number {
  const log05 = -0.693147180559945 // Math.Log(0.5f)
  return Math.pow(value, Math.log(b) / log05)
}

export function gain(g: number, value: number): number {
  if (value < 0.5) {
      return bias(1 - g, 2 * value) * 0.5
  }
  return 1 - bias(1 - g, 2 - 2 * value) * 0.5
}

// Coefficients of basis matrix.
const CR00 = -0.5
const CR01 = 1.5
const CR02 = -1.5
const CR03 = 0.5
const CR10 = 1.0
const CR11 = -2.5
const CR12 = 2.0
const CR13 = -0.5
const CR20 = -0.5
const CR21 = 0.0
const CR22 = 0.5
const CR23 = 0.0
const CR30 = 0.0
const CR31 = 1.0
const CR32 = 0.0
const CR33 = 0.0
export function Spline(value: number, ...knots: number[]): number {
    let span
    let nspans = knots.length - 3
    if (nspans < 1) {
        throw new Error('knots must have at least 4 values')
    }

    // find the appropriate 4-point span of the spline
    value = clamp(value, 0, 1) * nspans
    span = value | 0
    span = span >= knots.length - 3 ? knots.length - 3 : span
    value -= span

    // Evaluate the span cubic at x using Horner's rule.
    const c3 = CR00 * knots[span + 0] + CR01 * knots[span + 1]
        + CR02 * knots[span + 2] + CR03 * knots[span + 3]
    const c2 = CR10 * knots[span + 0] + CR11 * knots[span + 1]
        + CR12 * knots[span + 2] + CR13 * knots[span + 3]
    const c1 = CR20 * knots[span + 0] + CR21 * knots[span + 1]
        + CR22 * knots[span + 2] + CR23 * knots[span + 3]
    const c0 = CR30 * knots[span + 0] + CR31 * knots[span + 1]
        + CR32 * knots[span + 2] + CR33 * knots[span + 3]

    return ((c3 * value + c2) * value + c1) * value + c0
}

// const CatmullRomTable: number[] = []

// function CatmullRomInit(numSamples: number, numEntries: number) {

//     numSamples = CatmullRomSamples
//     numEntries = CatmullRomEntries

//     // Check whether the table needs to be initialized
//     if (CatmullRomTable.length > 0) {
//         return
//     }

//     let x
//     CatmullRomTable.length = 0
//     for (let i = 0; i < CatmullRomEntries; i++) {
//         x = i / CatmullRomSamples
//         x = Math.sqrt(x)
//         if (x < 1) {
//           CatmullRomTable[i] = (0.5 * (2 + x * x * (-5 + x * 3)))
//         } else {
//           CatmullRomTable[i] = (0.5 * (4 + x * (-8 + x * (5 - x))))
//         }
//     }
// }

// export function CatmullRom(value: number): number {
//   const CatmullRomSamples = 100
//   const CatmullRomEntries = 4 * CatmullRomSamples + 1

//   int samples, entries;
//   CatmullRomInit(out samples, out entries);

//   value = value * samples + 0.5
//   let j = floor(value)
//   if (j < entries) {
//       return CatmullRomTable[j]
//   }
//   return 0
// }
