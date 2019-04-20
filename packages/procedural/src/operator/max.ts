import { Sampler } from '../types'
import { samplerArray } from '../utils'

/**
 * Generates a sampler that returns the maximum value
 *
 * @public
 * @param src - The source sampler
 */
export function max(...src: Array<Sampler| number>): Sampler {
  const smpSrc = samplerArray(...src)
  return (...x: number[]) => Math.max(...(smpSrc.map((it) => it(...x))))
}
