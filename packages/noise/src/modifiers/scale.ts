import type { EmitContext } from '../emit/EmitContext'
import type { EvalContext } from '../evaluate'
import { Field } from '../Field'
import type { Params, ParamsOf, Tunable, Vec3 } from '../types'

/**
 * Samples the source at the point multiplied by a factor
 * @public
 */
export class ScaleField extends Field<any> {
  public readonly kind = 'scale'

  public constructor(
    public readonly source: Field<any>,
    public readonly factor: Tunable<number | Vec3>,
  ) {
    super([source], [factor])
  }

  public emit(ctx: EmitContext): string {
    return ctx.sample(this.source, `${ctx.p} * ${ctx.vector(this.factor)}`)
  }

  public evaluate(ctx: EvalContext, x: number, y: number, z: number, out: Float64Array): void {
    const f = this.factor
    // same channels as the source, it writes the result directly
    this.source.evaluate(ctx, x * ctx.component(f, 0), y * ctx.component(f, 1), z * ctx.component(f, 2), out)
  }
}

/**
 * Scales the input point, i.e. the frequency of the source. A scalar scales all axes
 * @public
 */
export function scale<T extends Tunable<number | Vec3>>(factor: T) {
  return <P extends Params>(source: Field<P>): Field<P & ParamsOf<T>> => new ScaleField(source, factor)
}
