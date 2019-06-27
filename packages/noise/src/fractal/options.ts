/**
 * Common fractal options
 * @public
 */
export interface FractalOptions {
  octaves: number
  frequency: number
  lacunarity: number
  persistence: number
  offset: number
  gain: number
}

/**
 * A sub set of {@link FractalOptions}
 * @public
 */
export type FractalParams = Partial<FractalOptions>
