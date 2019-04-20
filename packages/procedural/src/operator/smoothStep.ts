import { Sampler } from '../types'
import { sampler, smoothStep as s } from '../utils'

/**
 * Generates a sampler that steps between values
 *
 * @public
 * @param src - The source sampler
 * @param threshold1 - The threshold value
 * @param threshold2 - The threshold value
 * @param min - The minimum value
 * @param max - The maximum value
 */
export function smoothStep(
  src: Sampler | number,
  threshold1: Sampler | number = 0.25,
  threshold2: Sampler | number = 0.75,
  min: Sampler | number = 0,
  max: Sampler | number = 1,
): Sampler {
  const smpSrc = sampler(src)
  const smpT1 = sampler(threshold1)
  const smpT2 = sampler(threshold2)
  const smpMin = sampler(min)
  const smpMax = sampler(max)
  return (...x: number[]) => s(smpSrc(...x), smpT1(...x), smpT2(...x), smpMin(...x), smpMax(...x))
}
