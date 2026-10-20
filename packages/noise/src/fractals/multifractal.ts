import type { EmitContext } from '../emit/EmitContext'
import type { EvalContext } from '../evaluate'
import type { Field } from '../Field'
import type { Params, ParamsOfOptions, Tunable } from '../types'
import { FractalField, type FractalOptions } from './FractalField'

/**
 * Options of {@link multifractal}
 * @public
 */
export interface MultifractalOptions extends FractalOptions {
  /**
   * Added to each octave before multiplying. Defaults to `1`
   */
  offset?: Tunable
}

/**
 * Multiplicative multifractal
 * @public
 */
export class MultifractalField extends FractalField {
  public readonly kind = 'multifractal'
  public readonly offset: Tunable

  public constructor(source: Field<any>, options?: MultifractalOptions) {
    const offset = options?.offset ?? 1
    super(source, options, [offset])
    this.offset = offset
  }

  public emit(ctx: EmitContext): string {
    const product = ctx.local(ctx.type, ctx.splat(ctx.float(1)), 'product')
    const offset = ctx.value(this.offset)
    this.emitOctaves(ctx, (sample, amplitude) => {
      ctx.assign(product, `${product} * (${sample} * ${amplitude} + ${offset})`)
    })
    return product
  }

  public evaluate(ctx: EvalContext, x: number, y: number, z: number, out: Float64Array): void {
    const count = ctx.iterations(this.octaves, this.maxOctaves)
    const lacunarity = ctx.value(this.lacunarity)
    const gain = ctx.value(this.gain)
    const offset = ctx.value(this.offset)
    const lanes = this.channels
    const n = this.sampleBuffer
    out.fill(1, 0, lanes)
    let amplitude = 1
    for (let i = 0; i < count; i++) {
      this.source.evaluate(ctx, x, y, z, n)
      for (let l = 0; l < lanes; l++) {
        out[l] = out[l] * (n[l] * amplitude + offset)
      }
      x *= lacunarity
      y *= lacunarity
      z *= lacunarity
      amplitude *= gain
    }
  }
}

/**
 * Multiplies octaves of the source, the roughness varies across the field
 * @public
 */
export function multifractal<O extends MultifractalOptions = {}>(options?: O) {
  return <P extends Params>(source: Field<P>): Field<P & ParamsOfOptions<O>> =>
    new MultifractalField(source, options)
}
