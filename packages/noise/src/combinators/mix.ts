import type { EmitContext } from '../emit/EmitContext'
import type { EvalContext } from '../evaluate'
import { Field, maxChannelsOf } from '../Field'
import type { FieldInput, Params, ParamsOf } from '../types'

/**
 * Blends the source with another input
 * @public
 */
export class MixField extends Field<any> {
  public readonly kind = 'mix'
  private readonly otherBuffer = new Float64Array(4)
  private readonly weightBuffer = new Float64Array(4)

  public constructor(
    public readonly source: Field<any>,
    public readonly other: FieldInput,
    public readonly weight: FieldInput,
  ) {
    super(
      [source, other, weight].filter((it) => it instanceof Field),
      [other, weight],
      maxChannelsOf([source, other, weight]),
    )
  }

  public emit(ctx: EmitContext): string {
    return ctx.call('mix', ctx.sample(this.source), ctx.input(this.other), ctx.input(this.weight))
  }

  public evaluate(ctx: EvalContext, x: number, y: number, z: number, out: Float64Array): void {
    const b = this.otherBuffer
    const t = this.weightBuffer
    ctx.sample(this.source, x, y, z, out)
    ctx.input(this.other, x, y, z, b)
    ctx.input(this.weight, x, y, z, t)
    for (let l = 0; l < this.channels; l++) {
      out[l] = out[l] * (1 - t[l]) + b[l] * t[l]
    }
  }
}

/**
 * Blends the value towards `other` by `weight`. Both can be fields, e.g. a color and a mask
 * @public
 */
export function mix<O extends FieldInput, W extends FieldInput>(other: O, weight: W) {
  return <P extends Params>(source: Field<P>): Field<P & ParamsOf<O> & ParamsOf<W>> =>
    new MixField(source, other, weight)
}
