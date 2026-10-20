import type { EmitContext } from '../emit/EmitContext'
import type { EvalContext } from '../evaluate'
import { Field } from '../Field'
import type { Params, ParamsOf, Tunable } from '../types'

/**
 * Limits the source to a range
 * @public
 */
export class ClampField extends Field<any> {
  public readonly kind = 'clamp'

  public constructor(
    public readonly source: Field<any>,
    public readonly min: Tunable,
    public readonly max: Tunable,
  ) {
    super([source], [min, max])
  }

  public emit(ctx: EmitContext): string {
    return ctx.call('clamp', ctx.sample(this.source), ctx.splat(ctx.value(this.min)), ctx.splat(ctx.value(this.max)))
  }

  public evaluate(ctx: EvalContext, x: number, y: number, z: number, out: Float64Array): void {
    this.source.evaluate(ctx, x, y, z, out)
    const min = ctx.value(this.min)
    const max = ctx.value(this.max)
    for (let l = 0; l < this.channels; l++) {
      out[l] = Math.min(Math.max(out[l], min), max)
    }
  }
}

/**
 * Limits the value to `[min, max]`
 * @public
 */
export function clamp<L extends Tunable, H extends Tunable>(min: L, max: H) {
  return <P extends Params>(source: Field<P>): Field<P & ParamsOf<L> & ParamsOf<H>> =>
    new ClampField(source, min, max)
}
