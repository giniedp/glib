import { Sampler } from '../types'
import { FractalParams } from './options'

/**
 * Generates a fractal sampler
 *
 * @public
 * @param src - The source sampler
 */
export function fractal(
  src: Sampler,
  {
    octaves = 8,
    frequency = 1,
    lacunarity = 2,
    persistence = 1,
  }: FractalParams = {},
): Sampler {
  const exponents: number[] = []
  for (let i = 0; i <= octaves; i++) {
    exponents.push(Math.pow(lacunarity, -i * persistence))
  }

  return (...x: number[]): number => {
    let result = 0
    for (let i = 0; i < x.length; i++) {
      x[i] *= frequency
    }
    for (let j = 0; j <= octaves; j++) {
      result += src(...x) * exponents[j]
      for (let i = 0; i < x.length; i++) {
        x[i] *= lacunarity
      }
    }
    return result
  }
}
