import type { EmitContext } from '../emit/EmitContext'
import type { EvalContext } from '../evaluate'
import { Field } from '../Field'
import type { Params, ParamsOf, Tunable, Vec3 } from '../types'

/**
 * Samples the source at the point plus an offset
 * @public
 */
export class ShiftField extends Field<any> {
  public readonly kind = 'shift'

  public constructor(
    public readonly source: Field<any>,
    public readonly offset: Tunable<number | Vec3>,
  ) {
    super([source], [offset])
  }

  public emit(ctx: EmitContext): string {
    return ctx.sample(this.source, `${ctx.p} + ${ctx.vector(this.offset)}`)
  }

  public evaluate(ctx: EvalContext, x: number, y: number, z: number, out: Float64Array): void {
    const o = this.offset
    // same channels as the source, it writes the result directly
    this.source.evaluate(ctx, x + ctx.component(o, 0), y + ctx.component(o, 1), z + ctx.component(o, 2), out)
  }
}

/**
 * Moves the input point, e.g. by a `seed` uniform to get a different noise. A scalar moves along all axes
 * @public
 */
export function shift<T extends Tunable<number | Vec3>>(offset: T) {
  return <P extends Params>(source: Field<P>): Field<P & ParamsOf<T>> => new ShiftField(source, offset)
}
