import type { EmitContext } from '../emit/EmitContext'
import type { EvalContext } from '../evaluate'
import type { Field } from '../Field'
import type { Params, ParamsOfOptions, Tunable } from '../types'
import { FractalField, type FractalOptions } from './FractalField'

/**
 * Options of {@link hybrid}
 * @public
 */
export interface HybridOptions extends FractalOptions {
  /**
   * Added to each octave before weighting. Defaults to `0.7`
   */
  offset?: Tunable
}

/**
 * Hybrid multifractal
 * @public
 */
export class HybridField extends FractalField {
  public readonly kind = 'hybrid'
  public readonly offset: Tunable
  private readonly weight = new Float64Array(4)

  public constructor(source: Field<any>, options?: HybridOptions) {
    const offset = options?.offset ?? 0.7
    super(source, options, [offset])
    this.offset = offset
  }

  public emit(ctx: EmitContext): string {
    const sum = ctx.local(ctx.type, ctx.splat(ctx.float(0)), 'sum')
    const signal = ctx.local(ctx.type, ctx.splat(ctx.float(0)), 'signal')
    const weight = ctx.local(ctx.type, ctx.splat(ctx.float(1)), 'weight')
    const offset = ctx.value(this.offset)
    this.emitOctaves(ctx, (sample, amplitude) => {
      ctx.assign(signal, `(${sample} + ${offset}) * ${amplitude}`)
      ctx.assign(sum, `${sum} + ${weight} * ${signal}`)
      ctx.assign(weight, ctx.call('min', `${weight} * ${signal}`, ctx.splat(ctx.float(1))))
    })
    return sum
  }

  public evaluate(ctx: EvalContext, x: number, y: number, z: number, out: Float64Array): void {
    const count = ctx.iterations(this.octaves, this.maxOctaves)
    const lacunarity = ctx.value(this.lacunarity)
    const gain = ctx.value(this.gain)
    const offset = ctx.value(this.offset)
    const lanes = this.channels
    const n = this.sampleBuffer
    const weight = this.weight
    out.fill(0, 0, lanes)
    weight.fill(1, 0, lanes)
    let amplitude = 1
    for (let i = 0; i < count; i++) {
      this.source.evaluate(ctx, x, y, z, n)
      for (let l = 0; l < lanes; l++) {
        const signal = (n[l] + offset) * amplitude
        out[l] = out[l] + weight[l] * signal
        weight[l] = Math.min(weight[l] * signal, 1)
      }
      x *= lacunarity
      y *= lacunarity
      z *= lacunarity
      amplitude *= gain
    }
  }
}

/**
 * Hybrid multifractal: smooth valleys and rough peaks. Each octave is weighted by the previous ones
 * @public
 */
export function hybrid<O extends HybridOptions = {}>(options?: O) {
  return <P extends Params>(source: Field<P>): Field<P & ParamsOfOptions<O>> => new HybridField(source, options)
}
