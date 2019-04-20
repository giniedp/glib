import { Sampler } from '../types'
import { sampler } from '../utils'

/**
 * Generates a sampler that negates the source value
 *
 * @public
 * @param src - The source sampler
 */
export function negate(src: Sampler | number): Sampler {
  const smpSrc = sampler(src)
  return (...x: number[]) => -smpSrc(...x)
}
