import type { EmitContext } from '../emit/EmitContext'
import type { EvalContext } from '../evaluate'
import { Field } from '../Field'
import type { Params, ParamsOf, Tunable } from '../types'

/**
 * Raises the source to a power, keeping the sign
 * @public
 */
export class PowField extends Field<any> {
  public readonly kind = 'pow'

  public constructor(
    public readonly source: Field<any>,
    public readonly exponent: Tunable,
  ) {
    super([source], [exponent])
  }

  public emit(ctx: EmitContext): string {
    // pow of a negative base is undefined on the GPU
    const value = ctx.local(ctx.type, ctx.sample(this.source), 'base')
    const magnitude = ctx.call('pow', ctx.call('abs', value), ctx.splat(ctx.value(this.exponent)))
    return `${ctx.call('sign', value)} * ${magnitude}`
  }

  public evaluate(ctx: EvalContext, x: number, y: number, z: number, out: Float64Array): void {
    this.source.evaluate(ctx, x, y, z, out)
    const exponent = ctx.value(this.exponent)
    for (let l = 0; l < this.channels; l++) {
      out[l] = Math.sign(out[l]) * Math.pow(Math.abs(out[l]), exponent)
    }
  }
}

/**
 * Raises the value to a power, e.g. to sharpen peaks. Negative values keep their sign
 * @public
 */
export function pow<E extends Tunable>(exponent: E) {
  return <P extends Params>(source: Field<P>): Field<P & ParamsOf<E>> => new PowField(source, exponent)
}
