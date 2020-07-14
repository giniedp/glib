
import { Sampler } from '../types'

/**
 * Options for the {@link latticeNoise} sampler
 *
 * @public
 */
export interface LatticeNoiseOptions {
  prime1?: number
  prime2?: number
  prime3?: number
  primeX?: number
  primeY?: number
  primeZ?: number
}

const MAX_INT = 0x7fffffff
const TWO_OVER_MAX_INT = 2.0 / MAX_INT

/**
 * Generates a lattice noise sampler
 *
 * @public
 * @remarks
 * Lattice noise generator that generates noise values for integral coordinate inputs.
 * The noise function is taken from the book
 * Graphics Gems 2 (1991) - VIII. A Recursive implementation of the perlin noise function
 * All original seed values are preserved. The constructor allows to override the default seeds.
 */
export function latticeNoise({
  prime1 = 15731,
  prime2 = 789221,
  prime3 = 1376312589,
  primeX = 67,
  primeY = 59,
  primeZ = 71,
}: LatticeNoiseOptions = {}): Sampler {
  function noise(s: number) {
    // to signed 32 bit integer
    s = s | 0
    // generate the random base value and apply int mask
    s = ((s << 13) ^ s) | 0

    // the simple formula would be
    //     s = (s * (s * s * prime1 + prime2) + prime3) & MAX_INT
    //     return 1.0 - s * TWO_OVER_MAX_INT
    // however, we need 32bit integer operations in that formula, so we change it
    // for javascript like this

    let r = s * prime1 | 0
    r = (r * s + prime2) | 0
    r = (r * s + prime3) & MAX_INT
    return 1.0 - r * TWO_OVER_MAX_INT
  }
  return (...x: number[]) => {
    if (x.length === 1) {
      return noise(x[0])
    }
    if (x.length === 2) {
      return noise(x[0] * primeX + x[1] * primeY)
    }
    if (x.length === 3) {
      return noise(x[0] * primeX + x[1] * primeY + x[2] * primeZ)
    }
  }
}
