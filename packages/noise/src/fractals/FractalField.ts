import type { EmitContext } from '../emit/EmitContext'
import { Field } from '../Field'
import type { Tunable } from '../types'

/**
 * Options shared by all fractals
 * @public
 */
export interface FractalOptions {
  /**
   * Number of octaves. Defaults to `6`
   */
  octaves?: Tunable
  /**
   * Upper limit of the octaves, the loop bound of a uniform `octaves`. Changes the generated code. Defaults to `12`
   */
  maxOctaves?: number
  /**
   * Frequency factor from one octave to the next. Defaults to `2`
   */
  lacunarity?: Tunable
  /**
   * Amplitude factor from one octave to the next. Defaults to `0.5`
   */
  gain?: Tunable
}

/**
 * Base of fractals: sums octaves of a source with increasing frequency and decreasing amplitude
 * @public
 */
export abstract class FractalField extends Field<any> {
  public readonly octaves: Tunable
  public readonly maxOctaves: number
  public readonly lacunarity: Tunable
  public readonly gain: Tunable

  /**
   * Scratch buffer for the samples of the source
   */
  protected readonly sampleBuffer = new Float64Array(4)

  protected constructor(
    public readonly source: Field<any>,
    options: FractalOptions | undefined,
    inputs: unknown[] = [],
  ) {
    const octaves = options?.octaves ?? 6
    const lacunarity = options?.lacunarity ?? 2
    const gain = options?.gain ?? 0.5
    super([source], [octaves, lacunarity, gain, ...inputs])
    this.octaves = octaves
    this.maxOctaves = options?.maxOctaves ?? 12
    this.lacunarity = lacunarity
    this.gain = gain
  }

  /**
   * Emits the octave loop. `body` receives the sample of the source and the amplitude of the octave
   */
  protected emitOctaves(ctx: EmitContext, body: (sample: string, amplitude: string) => void): void {
    const point = ctx.local('vec3', ctx.p, 'q')
    const amplitude = ctx.local('float', ctx.float(1), 'amp')
    ctx.loop(this.octaves, this.maxOctaves, () => {
      const sample = ctx.local(ctx.type, ctx.sample(this.source, point), 'n')
      body(sample, amplitude)
      ctx.assign(point, `${point} * ${ctx.value(this.lacunarity)}`)
      ctx.assign(amplitude, `${amplitude} * ${ctx.value(this.gain)}`)
    })
  }
}
