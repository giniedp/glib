import type { EmitContext } from '../emit/EmitContext'
import type { EvalContext } from '../evaluate'
import { Field } from '../Field'
import type { Params } from '../types'

/**
 * Sets the alpha channel of the source to 1
 * @public
 */
export class OpaqueField extends Field<any> {
  public readonly kind = 'opaque'

  public constructor(public readonly source: Field<any>) {
    super([source], [], 4)
  }

  public emit(ctx: EmitContext): string {
    const value = ctx.local('vec4', ctx.sample(this.source), 'color')
    return ctx.vec4(`${value}.x`, `${value}.y`, `${value}.z`, ctx.float(1))
  }

  public evaluate(ctx: EvalContext, x: number, y: number, z: number, out: Float64Array): void {
    ctx.sample(this.source, x, y, z, out)
    out[3] = 1
  }
}

/**
 * Sets alpha to 1. A scalar field has its value in all channels, alpha included, this makes it opaque
 * @public
 */
export function opaque() {
  return <P extends Params>(source: Field<P>): Field<P> => new OpaqueField(source)
}
