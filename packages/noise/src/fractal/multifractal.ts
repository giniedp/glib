import { Sampler } from '../types'
import { FractalParams } from './options'

/**
 * Generates a multi fractal sampler
 *
 * @public
 * @param src - The source sampler
 */
export function multifractal(src: Sampler, {
  octaves = 8,
  frequency = 1,
  lacunarity = 2,
  persistence = 1,
  offset = 1,
}: FractalParams = {}): Sampler {
  const exponents: number[] = []
  for (let i = 0; i <= octaves; i++) {
    exponents.push(Math.pow(lacunarity, -i * persistence))
  }

  return (...x: number[]): number => {
    for (let i = 0; i < x.length; i++) {
      x[i] *= frequency
    }
    let result = 1
    for (let j = 1; j <= octaves; j++) {
      result *= src(...x) * exponents[j] + offset
      for (let i = 0; i < x.length; i++) {
        x[i] *= lacunarity
      }
    }
    return result
  }
}
