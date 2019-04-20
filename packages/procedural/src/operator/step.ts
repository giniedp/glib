import { Sampler } from '../types'
import { sampler } from '../utils'

/**
 * Generates a sampler that steps between values
 *
 * @public
 * @param src - The source sampler
 * @param threshold - The threshold value
 * @param min - The minimum value
 * @param max - The maximum value
 */
export function step(
  src: Sampler | number,
  threshold: Sampler | number = 0.5,
  min: Sampler | number = 0,
  max: Sampler | number = 1,
): Sampler {
  const smpSrc = sampler(src)
  const smpTresh = sampler(threshold)
  const smpMin = sampler(min)
  const smpMax = sampler(max)
  return (...x: number[]) => smpSrc(...x) < smpTresh(...x) ? smpMin(...x) : smpMax(...x)
}
