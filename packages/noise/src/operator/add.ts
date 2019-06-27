import { Sampler } from '../types'
import { samplerArray } from '../utils'

/**
 * Generates a sampler that sums the results of all source samplers
 *
 * @public
 * @param src - The source sampler
 */
export function add(...src: Array<Sampler| number>): Sampler {
  const smpSrc = samplerArray(...src)
  return (...x: number[]) => {
    let result = 0
    for (const op of smpSrc) {
      result += op(...x)
    }
    return result
  }
}
