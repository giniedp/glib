import type { EmitContext } from '../emit/EmitContext'
import type { EvalContext } from '../evaluate'
import { Field } from '../Field'
import type { ParamsOf, Tunable, Vec4 } from '../types'
import { type ColorInput, toColor } from './parse'

/**
 * A field with the same color everywhere
 * @public
 */
export class ColorField extends Field<any> {
  public readonly kind = 'color'
  public readonly value: Tunable<Vec4>

  public constructor(value: ColorInput) {
    const color = toColor(value)
    super([], [color], 4)
    this.value = color
  }

  public override emitInline(ctx: EmitContext): string {
    return ctx.input(this.value)
  }

  public emit(ctx: EmitContext): string {
    return ctx.input(this.value)
  }

  public evaluate(ctx: EvalContext, x: number, y: number, z: number, out: Float64Array): void {
    ctx.input(this.value, x, y, z, out)
  }
}

/**
 * A field with the same color everywhere: a hex string, an rgba vector or a vec4 uniform
 * @public
 * @example
 * ```ts
 * perlin().pipe(mix(color('#ff8800'), cell()))
 * ```
 */
export function color<T extends ColorInput>(value: T): Field<ParamsOf<T> & {}> {
  return new ColorField(value)
}
