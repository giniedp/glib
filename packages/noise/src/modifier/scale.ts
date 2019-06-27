import { Sampler } from '../types'

/**
 * Generates a sampler that scales the input values
 *
 * @public
 * @param src - The source sampler
 * @param scalar - The scale values
 */
export function scale(src: Sampler, ...scalar: number[]): Sampler {
  return (...x: number[]) => {
    for (let i = 0; i < x.length; i++) {
      x[i] *= scalar[i] != null ? scalar[i] : 1
    }
    return src(...x)
  }
}
