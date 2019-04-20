import { Sampler } from '../types'
import { FractalOptions } from './options'

export function hybridMultifractal(src: Sampler, {
  octaves = 8,
  frequency = 1,
  lacunarity = 2,
  persistence = 1,
  offset = 1,
}: FractalOptions = {}): Sampler {
  const exponents: number[] = []
  for (let i = 0; i <= octaves; i++) {
    exponents.push(Math.pow(lacunarity, -i * persistence))
  }

  return (...x: number[]): number => {
    for (let i = 0; i < x.length; i++) {
      x[i] *= frequency
    }
    let result = 0
    let signal = 0
    let weight = 0
    for (let j = 1; j <= octaves; j++) {
      for (let i = 0; i < x.length; i++) {
        x[i] *= lacunarity
      }
      // prevent divergence
      weight = weight > 1 ? 1 : weight

      // get next higher frequency
      signal = (src(...x) + offset) * exponents[j]

      // add it in, weighted by previous frequency local value
      result += signal * weight

      // update the (monotonically decreasing) weighting value
      weight *= signal
    }
    return result
  }
}
