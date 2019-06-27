import { Sampler } from '../types'
import { samplerArray } from '../utils'

/**
 * Generates a sampler that returns a minimum value
 *
 * @public
 * @param src - The source sampler
 */
export function min(...src: Array<Sampler| number>): Sampler {
  const smpSrc = samplerArray(...src)
  return (...x: number[]) => Math.min(...(smpSrc.map((it) => it(...x))))
}
