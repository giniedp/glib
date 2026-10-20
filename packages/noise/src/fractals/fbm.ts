import type { EmitContext } from '../emit/EmitContext'
import type { EvalContext } from '../evaluate'
import type { Field } from '../Field'
import type { Params, ParamsOfOptions } from '../types'
import { FractalField, type FractalOptions } from './FractalField'

/**
 * Fractal brownian motion: the sum of octaves
 * @public
 */
export class FbmField extends FractalField {
  public readonly kind = 'fbm'

  public constructor(source: Field<any>, options?: FractalOptions) {
    super(source, options)
  }

  public emit(ctx: EmitContext): string {
    const sum = ctx.local(ctx.type, ctx.splat(ctx.float(0)), 'sum')
    this.emitOctaves(ctx, (sample, amplitude) => {
      ctx.assign(sum, `${sum} + ${sample} * ${amplitude}`)
    })
    return sum
  }

  public evaluate(ctx: EvalContext, x: number, y: number, z: number, out: Float64Array): void {
    const count = ctx.iterations(this.octaves, this.maxOctaves)
    const lacunarity = ctx.value(this.lacunarity)
    const gain = ctx.value(this.gain)
    const lanes = this.channels
    const n = this.sampleBuffer
    out.fill(0, 0, lanes)
    let amplitude = 1
    for (let i = 0; i < count; i++) {
      this.source.evaluate(ctx, x, y, z, n)
      for (let l = 0; l < lanes; l++) {
        out[l] = out[l] + n[l] * amplitude
      }
      x *= lacunarity
      y *= lacunarity
      z *= lacunarity
      amplitude *= gain
    }
  }
}

/**
 * Sums octaves of the source with increasing frequency and decreasing amplitude
 * @public
 */
export function fbm<O extends FractalOptions = {}>(options?: O) {
  return <P extends Params>(source: Field<P>): Field<P & ParamsOfOptions<O>> => new FbmField(source, options)
}
