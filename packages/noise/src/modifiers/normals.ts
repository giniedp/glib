import type { EmitContext } from '../emit/EmitContext'
import type { EvalContext } from '../evaluate'
import { Field } from '../Field'
import type { Params, ParamsOf, Tunable } from '../types'

/**
 * Options of {@link normals}
 * @public
 */
export interface NormalsOptions<S extends Tunable = Tunable> {
  /**
   * Factor of the slopes, i.e. the height of the source. Defaults to `1`
   */
  strength?: S
  /**
   * Distance of the samples for the central differences. Defaults to `0.002`
   */
  epsilon?: number
}

/**
 * Tangent space normals of a height field, encoded as color
 * @public
 */
export class NormalsField extends Field<any> {
  public readonly kind = 'normals'
  public readonly strength: Tunable
  public readonly epsilon: number
  private readonly buffer = new Float64Array(4)

  public constructor(
    public readonly source: Field<any>,
    options: NormalsOptions | undefined,
  ) {
    const strength = options?.strength ?? 1
    super([source], [strength], 4)
    this.strength = strength
    this.epsilon = options?.epsilon ?? 0.002
  }

  public emit(ctx: EmitContext): string {
    const p = ctx.p
    const e = ctx.float(this.epsilon)
    const zero = ctx.float(0)
    const s = ctx.value(this.strength)
    const dx = ctx.vec3(e, zero, zero)
    const dy = ctx.vec3(zero, e, zero)
    const x0 = ctx.scalar(this.source, `${p} - ${dx}`)
    const x1 = ctx.scalar(this.source, `${p} + ${dx}`)
    const y0 = ctx.scalar(this.source, `${p} - ${dy}`)
    const y1 = ctx.scalar(this.source, `${p} + ${dy}`)
    const n = ctx.local(
      'vec3',
      ctx.call('normalize', ctx.vec3(`(${x0} - ${x1}) * ${s}`, `(${y0} - ${y1}) * ${s}`, ctx.float(2 * this.epsilon))),
      'n',
    )
    return ctx.vec4(`${n}.x * 0.5 + 0.5`, `${n}.y * 0.5 + 0.5`, `${n}.z * 0.5 + 0.5`, ctx.float(1))
  }

  public evaluate(ctx: EvalContext, x: number, y: number, z: number, out: Float64Array): void {
    const e = this.epsilon
    const s = ctx.value(this.strength)
    const b = this.buffer
    const nx = (ctx.scalar(this.source, x - e, y, z, b) - ctx.scalar(this.source, x + e, y, z, b)) * s
    const ny = (ctx.scalar(this.source, x, y - e, z, b) - ctx.scalar(this.source, x, y + e, z, b)) * s
    const nz = 2 * e
    const length = Math.sqrt(nx * nx + ny * ny + nz * nz)
    out[0] = (nx / length) * 0.5 + 0.5
    out[1] = (ny / length) * 0.5 + 0.5
    out[2] = (nz / length) * 0.5 + 0.5
    out[3] = 1
  }
}

/**
 * Turns a height field (its first channel) into a normal map: tangent space normals with x along the texel columns
 * and y along the texel rows, encoded as `n * 0.5 + 0.5`. Alpha is `1`
 *
 * @public
 * @remarks
 * The slopes are measured in units of the field, scale the height with `strength`. A seamless height field gives a
 * seamless normal map.
 *
 * @example
 * ```ts
 * const height = perlin().pipe(fbm({ octaves: 6 }), seamless(4, { mean: 0 }))
 * const normalMap = height.pipe(normals({ strength: 0.5 }))
 * ```
 */
export function normals<S extends Tunable = number>(options?: NormalsOptions<S>) {
  return <P extends Params>(source: Field<P>): Field<P & ParamsOf<S>> => new NormalsField(source, options)
}
