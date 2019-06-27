import { Sampler } from '../types'
import { sampler } from '../utils'

/**
 * Generates a sampler that utilizes the sinus function
 *
 * @public
 * @param src - The source sampler
 * @param offset - The offset sampler
 */
export function sinus(src: Sampler | number, offset: Sampler | number = 0): Sampler {
  const smpSrc = sampler(src)
  const smpOff = sampler(offset)
  return (...x: number[]) => Math.sin(smpSrc(...x) + smpOff(...x))
}
