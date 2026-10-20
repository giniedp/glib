import type { EmitContext } from '../emit/EmitContext'
import type { EvalContext } from '../evaluate'
import { Field } from '../Field'
import type { Params, ParamsOf, Tunable } from '../types'

/**
 * Linearly maps the source from one range to another
 * @public
 */
export class RemapField extends Field<any> {
  public readonly kind = 'remap'

  public constructor(
    public readonly source: Field<any>,
    public readonly inMin: Tunable,
    public readonly inMax: Tunable,
    public readonly outMin: Tunable,
    public readonly outMax: Tunable,
  ) {
    super([source], [inMin, inMax, outMin, outMax])
  }

  public emit(ctx: EmitContext): string {
    const inMin = ctx.value(this.inMin)
    const outMin = ctx.value(this.outMin)
    const t = `(${ctx.sample(this.source)} - ${inMin}) / (${ctx.value(this.inMax)} - ${inMin})`
    return `${outMin} + ${t} * (${ctx.value(this.outMax)} - ${outMin})`
  }

  public evaluate(ctx: EvalContext, x: number, y: number, z: number, out: Float64Array): void {
    this.source.evaluate(ctx, x, y, z, out)
    const inMin = ctx.value(this.inMin)
    const inRange = ctx.value(this.inMax) - inMin
    const outMin = ctx.value(this.outMin)
    const outRange = ctx.value(this.outMax) - outMin
    for (let l = 0; l < this.channels; l++) {
      out[l] = outMin + ((out[l] - inMin) / inRange) * outRange
    }
  }
}

/**
 * Maps the value from `[inMin, inMax]` to `[outMin, outMax]`, e.g. noise from [-1, 1] to [0, 1]
 * @public
 */
export function remap<A extends Tunable, B extends Tunable, C extends Tunable, D extends Tunable>(
  inMin: A,
  inMax: B,
  outMin: C,
  outMax: D,
) {
  return <P extends Params>(
    source: Field<P>,
  ): Field<P & ParamsOf<A> & ParamsOf<B> & ParamsOf<C> & ParamsOf<D>> =>
    new RemapField(source, inMin, inMax, outMin, outMax)
}
