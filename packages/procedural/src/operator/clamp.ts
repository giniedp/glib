import { Sampler } from '../types'
import { clamp as c, sampler } from '../utils'

/**
 * Generates a sampler that clamps the result of the source
 *
 * @public
 * @param src - The source sampler
 * @param min - The minimum value sampler
 * @param max - The maximum value sampler
 */
export function clamp(
  src: Sampler | number,
  min: Sampler | number = 0,
  max: Sampler | number = 1,
): Sampler {
  const smpSrc = sampler(src)
  const smpMin = sampler(min)
  const smpMax = sampler(max)
  return (...x: number[]) => c(smpSrc(...x), smpMin(...x), smpMax(...x))
}
