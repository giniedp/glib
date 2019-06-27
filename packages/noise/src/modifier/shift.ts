import { Sampler } from '../types'

/**
 * Generates a sampler that shifts the input values
 *
 * @public
 * @param src - The source sampler
 * @param scalar - The scale values
 */
export function shift(src: Sampler, ...s: number[]): Sampler {
  return (...x: number[]) => {
    for (let i = 0; i < x.length; i++) {
      x[i] += s[i] != null ? s[i] : 1
    }
    return src(...x)
  }
}
