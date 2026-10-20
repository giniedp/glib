import type { EmitContext } from '../emit/EmitContext'
import type { EvalContext } from '../evaluate'
import { Field } from '../Field'
import type { ParamsOf, Tunable } from '../types'

/**
 * A field with the same scalar value everywhere
 * @public
 */
export class ConstantField extends Field<any> {
  public readonly kind = 'constant'

  public constructor(public readonly value: Tunable) {
    super([], [value], 1)
  }

  public override emitInline(ctx: EmitContext): string {
    return ctx.value(this.value)
  }

  public emit(ctx: EmitContext): string {
    return ctx.value(this.value)
  }

  public evaluate(ctx: EvalContext, x: number, y: number, z: number, out: Float64Array): void {
    out[0] = ctx.value(this.value)
  }
}

/**
 * A field with the same value everywhere, a number or a uniform. For colors see `color`
 * @public
 */
export function constant<T extends Tunable>(value: T): Field<ParamsOf<T> & {}> {
  return new ConstantField(value)
}
