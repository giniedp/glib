import { Sampler } from '../types'

/**
 * Generates a sampler that always returns a constant value
 *
 * @public
 * @param value - The constant value to return
 */
export function constant(value: number): Sampler {
  return (...x: number[]) => value
}
