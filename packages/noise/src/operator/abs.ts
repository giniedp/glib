import { Sampler } from '../types'
import { sampler } from '../utils'

/**
 * Generates a Sampler that always returns an absolute value
 *
 * @public
 * @param src - The source sampler
 */
export function abs(src: Sampler | number): Sampler {
  const smpSrc = sampler(src)
  return (...v: number[]) => Math.abs(smpSrc(...v))
}
