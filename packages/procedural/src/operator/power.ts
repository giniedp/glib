import { Sampler } from '../types'
import { sampler } from '../utils'

/**
 * Generates a sampler that powers the base value
 *
 * @public
 * @param base - The base sampler
 * @param exp - The exponent sampler
 */
export function power(base: Sampler | number, exp: Sampler | number): Sampler {
  const smpBase = sampler(base)
  const smpExp = sampler(exp)
  return (...x: number[]) => Math.pow(smpBase(...x), smpExp(...x))
}
