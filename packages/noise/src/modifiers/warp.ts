import type { EmitContext } from '../emit/EmitContext'
import type { EvalContext } from '../evaluate'
import { Field } from '../Field'
import type { Params, ParamsOf, Tunable, Vec3 } from '../types'

// sample the displacement field at decorrelated points, one per axis
const OFFSET_Y: Vec3 = [5.2, 1.3, 7.1]
const OFFSET_Z: Vec3 = [1.7, 9.2, 3.4]

/**
 * Samples the source at the point displaced by the first channel of another field
 * @public
 */
export class WarpField extends Field<any> {
  public readonly kind = 'warp'
  private readonly buffer = new Float64Array(4)

  public constructor(
    public readonly source: Field<any>,
    public readonly displacement: Field<any>,
    public readonly strength: Tunable,
  ) {
    super([source, displacement], [strength], source.channels)
  }

  public emit(ctx: EmitContext): string {
    const p = ctx.p
    const d = this.displacement
    const dx = ctx.scalar(d, p)
    const dy = ctx.scalar(d, `${p} + ${ctx.vector(OFFSET_Y)}`)
    const dz = ctx.scalar(d, `${p} + ${ctx.vector(OFFSET_Z)}`)
    const offset = ctx.local('vec3', ctx.vec3(dx, dy, dz), 'warp')
    return ctx.sample(this.source, `${p} + ${offset} * ${ctx.value(this.strength)}`)
  }

  public evaluate(ctx: EvalContext, x: number, y: number, z: number, out: Float64Array): void {
    const d = this.displacement
    const b = this.buffer
    const s = ctx.value(this.strength)
    const dx = ctx.scalar(d, x, y, z, b)
    const dy = ctx.scalar(d, x + OFFSET_Y[0], y + OFFSET_Y[1], z + OFFSET_Y[2], b)
    const dz = ctx.scalar(d, x + OFFSET_Z[0], y + OFFSET_Z[1], z + OFFSET_Z[2], b)
    // same channels as the source, it writes the result directly
    this.source.evaluate(ctx, x + dx * s, y + dy * s, z + dz * s, out)
  }
}

/**
 * Displaces the input point by a field (domain warping). Defaults to a strength of `1`.
 * A color displacement field uses its first channel
 * @public
 */
export function warp<D extends Field<any>, S extends Tunable = number>(displacement: D, strength?: S) {
  return <P extends Params>(source: Field<P>): Field<P & ParamsOf<D> & ParamsOf<S>> =>
    new WarpField(source, displacement, strength ?? 1)
}
