import type { EmitContext } from '../emit/EmitContext'
import type { EvalContext } from '../evaluate'
import type { Field } from '../Field'
import type { Params, ParamsOfOptions, Tunable } from '../types'
import { FractalField, type FractalOptions } from './FractalField'

/**
 * Options of {@link ridged}
 * @public
 */
export interface RidgedOptions extends FractalOptions {
  /**
   * Height of the ridges, the signal is `offset - abs(noise)`. Defaults to `1`
   */
  offset?: Tunable
  /**
   * How much an octave is damped by the previous one, higher values give sharper ridges. Defaults to `2`
   */
  weighting?: Tunable
}

/**
 * Ridged multifractal
 * @public
 */
export class RidgedField extends FractalField {
  public readonly kind = 'ridged'
  public readonly offset: Tunable
  public readonly weighting: Tunable
  private readonly weight = new Float64Array(4)

  public constructor(source: Field<any>, options?: RidgedOptions) {
    const offset = options?.offset ?? 1
    const weighting = options?.weighting ?? 2
    super(source, options, [offset, weighting])
    this.offset = offset
    this.weighting = weighting
  }

  public emit(ctx: EmitContext): string {
    const sum = ctx.local(ctx.type, ctx.splat(ctx.float(0)), 'sum')
    const signal = ctx.local(ctx.type, ctx.splat(ctx.float(0)), 'signal')
    const weight = ctx.local(ctx.type, ctx.splat(ctx.float(1)), 'weight')
    const offset = ctx.value(this.offset)
    const weighting = ctx.value(this.weighting)
    this.emitOctaves(ctx, (sample, amplitude) => {
      ctx.assign(signal, `${offset} - ${ctx.call('abs', sample)}`)
      ctx.assign(signal, `${signal} * ${signal} * ${weight}`)
      ctx.assign(weight, ctx.call('clamp', `${signal} * ${weighting}`, ctx.splat(ctx.float(0)), ctx.splat(ctx.float(1))))
      ctx.assign(sum, `${sum} + ${signal} * ${amplitude}`)
    })
    return sum
  }

  public evaluate(ctx: EvalContext, x: number, y: number, z: number, out: Float64Array): void {
    const count = ctx.iterations(this.octaves, this.maxOctaves)
    const lacunarity = ctx.value(this.lacunarity)
    const gain = ctx.value(this.gain)
    const offset = ctx.value(this.offset)
    const weighting = ctx.value(this.weighting)
    const lanes = this.channels
    const n = this.sampleBuffer
    const weight = this.weight
    out.fill(0, 0, lanes)
    weight.fill(1, 0, lanes)
    let amplitude = 1
    for (let i = 0; i < count; i++) {
      this.source.evaluate(ctx, x, y, z, n)
      for (let l = 0; l < lanes; l++) {
        let signal = offset - Math.abs(n[l])
        signal = signal * signal * weight[l]
        weight[l] = Math.min(Math.max(signal * weighting, 0), 1)
        out[l] = out[l] + signal * amplitude
      }
      x *= lacunarity
      y *= lacunarity
      z *= lacunarity
      amplitude *= gain
    }
  }
}

/**
 * Ridged multifractal: sharp ridges like mountain ranges. Each octave is damped where the previous one is low
 * @public
 */
export function ridged<O extends RidgedOptions = {}>(options?: O) {
  return <P extends Params>(source: Field<P>): Field<P & ParamsOfOptions<O>> => new RidgedField(source, options)
}
