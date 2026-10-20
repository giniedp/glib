import type { EmitContext } from '../emit/EmitContext'
import type { EvalContext } from '../evaluate'
import { Field } from '../Field'
import type { Params, ParamsOf, Tunable } from '../types'

/**
 * Smooth hermite step of the source between two edges
 * @public
 */
export class SmoothstepField extends Field<any> {
  public readonly kind = 'smoothstep'

  public constructor(
    public readonly source: Field<any>,
    public readonly edge0: Tunable,
    public readonly edge1: Tunable,
  ) {
    super([source], [edge0, edge1])
  }

  public emit(ctx: EmitContext): string {
    const edge0 = ctx.splat(ctx.value(this.edge0))
    const edge1 = ctx.splat(ctx.value(this.edge1))
    return ctx.call('smoothstep', edge0, edge1, ctx.sample(this.source))
  }

  public evaluate(ctx: EvalContext, x: number, y: number, z: number, out: Float64Array): void {
    this.source.evaluate(ctx, x, y, z, out)
    const edge0 = ctx.value(this.edge0)
    const edge1 = ctx.value(this.edge1)
    for (let l = 0; l < this.channels; l++) {
      const t = Math.min(Math.max((out[l] - edge0) / (edge1 - edge0), 0), 1)
      out[l] = t * t * (3 - 2 * t)
    }
  }
}

/**
 * Smoothly maps the value from `[edge0, edge1]` to `[0, 1]`. Requires `edge0 < edge1`
 * @public
 */
export function smoothstep<A extends Tunable, B extends Tunable>(edge0: A, edge1: B) {
  return <P extends Params>(source: Field<P>): Field<P & ParamsOf<A> & ParamsOf<B>> =>
    new SmoothstepField(source, edge0, edge1)
}
