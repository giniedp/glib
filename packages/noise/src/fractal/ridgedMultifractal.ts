import { Sampler } from '../types'
import { FractalParams } from './options'

/**
 * Generates a ridged multi fractal sampler
 *
 * @public
 * @param src - The source sampler
 */
export function ridgedMultifractal(src: Sampler, {
  octaves = 8,
  frequency = 1,
  lacunarity = 2,
  persistence = 1,
  offset = 1,
  gain = 2,
}: FractalParams = {}): Sampler {
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

    // get first octave
    signal = src(...x)
    // get absolute value. this creates the ridges
    signal = signal < 0 ? -signal : signal
    // invert and translate (offset should be ~= 1)
    signal = offset - signal
    // square the signal to increase the sharpness
    signal *= signal
    // assign initial value
    result = signal

    for (let j = 1; j <= octaves; j++) {
      for (let i = 0; i < x.length; i++) {
        x[i] *= lacunarity
      }

      weight = signal * gain
      weight = weight > 1 ? 1 : (weight < 0 ? 0 : weight)

      signal = src(...x)
      signal = signal < 0 ? -signal : signal
      signal = offset - signal
      signal *= signal
      result += signal * exponents[j]
    }
    return result
  }
}
