import type { EmitContext } from '../emit/EmitContext'
import type { EvalContext } from '../evaluate'
import { Field } from '../Field'
import type { ParamsOfInputs, Tunable } from '../types'

/**
 * A scalar input of {@link rgba}: a field (its first channel), a number or a uniform
 * @public
 */
export type ComponentInput = Field<any> | Tunable

/**
 * Composes a color from four scalar inputs
 * @public
 */
export class RgbaField extends Field<any> {
  public readonly kind = 'rgba'
  private readonly buffer = new Float64Array(4)

  public constructor(public readonly components: readonly [ComponentInput, ComponentInput, ComponentInput, ComponentInput]) {
    super(
      components.filter((it) => it instanceof Field),
      components,
      4,
    )
  }

  public emit(ctx: EmitContext): string {
    const [r, g, b, a] = this.components.map((it) => (it instanceof Field ? ctx.scalar(it) : ctx.value(it)))
    return ctx.vec4(r, g, b, a)
  }

  public evaluate(ctx: EvalContext, x: number, y: number, z: number, out: Float64Array): void {
    const components = this.components
    for (let i = 0; i < 4; i++) {
      const it = components[i]
      out[i] = it instanceof Field ? ctx.scalar(it, x, y, z, this.buffer) : ctx.value(it)
    }
  }
}

/**
 * A color from four scalar inputs: fields (their first channel), numbers or uniforms
 * @public
 * @example
 * ```ts
 * rgba(perlin(), cell(), 0.5)
 * ```
 */
export function rgba<R extends ComponentInput, G extends ComponentInput, B extends ComponentInput, A extends ComponentInput = 1>(
  r: R,
  g: G,
  b: B,
  a?: A,
): Field<ParamsOfInputs<[R, G, B, A]> & {}> {
  return new RgbaField([r, g, b, a ?? 1])
}
