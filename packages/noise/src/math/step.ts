import type { EmitContext } from '../emit/EmitContext'
import type { EvalContext } from '../evaluate'
import { Field } from '../Field'
import type { Params, ParamsOf, Tunable } from '../types'

/**
 * `1` where the source is at least the edge, `0` elsewhere
 * @public
 */
export class StepField extends Field<any> {
  public readonly kind = 'step'

  public constructor(
    public readonly source: Field<any>,
    public readonly edge: Tunable,
  ) {
    super([source], [edge])
  }

  public emit(ctx: EmitContext): string {
    return ctx.call('step', ctx.splat(ctx.value(this.edge)), ctx.sample(this.source))
  }

  public evaluate(ctx: EvalContext, x: number, y: number, z: number, out: Float64Array): void {
    this.source.evaluate(ctx, x, y, z, out)
    const edge = ctx.value(this.edge)
    for (let l = 0; l < this.channels; l++) {
      out[l] = out[l] >= edge ? 1 : 0
    }
  }
}

/**
 * Returns `1` where the value is at least `edge` and `0` elsewhere, e.g. for masks
 * @public
 */
export function step<E extends Tunable>(edge: E) {
  return <P extends Params>(source: Field<P>): Field<P & ParamsOf<E>> => new StepField(source, edge)
}
