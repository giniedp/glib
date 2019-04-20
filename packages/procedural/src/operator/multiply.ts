import { Sampler } from '../types'
import { samplerArray } from '../utils'

/**
 * Generates a sampler that multiplies all values
 *
 * @public
 * @param src - The source sampler
 */
export function multiply(...src: Array<Sampler | number>): Sampler {
  const smpSrc = samplerArray(...src)
  return (...x: number[]) => {
    let result = 1
    for (const op of smpSrc) {
      result *= op(...x)
    }
    return result
  }
}
