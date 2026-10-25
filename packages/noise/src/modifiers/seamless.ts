import type { EmitContext } from '../emit/EmitContext'
import type { EvalContext } from '../evaluate'
import { Field } from '../Field'
import type { Params, ParamsOf, ParamsOfInputs, Tunable } from '../types'

/**
 * Size of the period of {@link seamless}: one value for both axes or `[width, height]`
 * @public
 */
export type SeamlessSize = Tunable | readonly [Tunable, Tunable]

/**
 * Options of {@link seamless}
 * @public
 */
export interface SeamlessOptions<M extends Tunable = Tunable> {
  /**
   * Mean value of the source. When set, the blend keeps the contrast around it, otherwise the tile center
   * looks flatter than its edges. Noise sources and fbm have a mean of `0`
   */
  mean?: M
}

// blend weight by the position in the period. Its slope is 0 at both ends, so the slope of the result
// does not jump where the texture repeats, e.g. no lines in normal maps
function smooth(t: number): number {
  return t * t * (3 - 2 * t)
}

/**
 * Makes the source periodic in x and y by blending it with copies shifted by the period
 * @public
 */
export class SeamlessField extends Field<any> {
  public readonly kind = 'seamless'
  public readonly width: Tunable
  public readonly height: Tunable
  private readonly buffers = [new Float64Array(4), new Float64Array(4), new Float64Array(4), new Float64Array(4)]
  private readonly weights = new Float64Array(4)

  public constructor(
    public readonly source: Field<any>,
    size: SeamlessSize,
    public readonly mean: Tunable | undefined,
  ) {
    const [width, height] = Array.isArray(size) ? size : [size, size]
    super([source], [width, height, mean], source.channels)
    this.width = width
    this.height = height
  }

  public emit(ctx: EmitContext): string {
    const p = ctx.p
    const w = ctx.value(this.width)
    const h = ctx.value(this.height)
    const zero = ctx.float(0)
    // the point wrapped into the period [0, w) x [0, h), z is kept
    const q = ctx.local('vec3', `${p} - ${ctx.vec3(`${w} * floor(${p}.x / ${w})`, `${h} * floor(${p}.y / ${h})`, zero)}`, 'q')
    const u = ctx.local('float', ctx.call('smoothstep', zero, ctx.float(1), `${q}.x / ${w}`), 'u')
    const v = ctx.local('float', ctx.call('smoothstep', zero, ctx.float(1), `${q}.y / ${h}`), 'v')
    const samples = [
      ctx.sample(this.source, q),
      ctx.sample(this.source, `${q} - ${ctx.vec3(w, zero, zero)}`),
      ctx.sample(this.source, `${q} - ${ctx.vec3(zero, h, zero)}`),
      ctx.sample(this.source, `${q} - ${ctx.vec3(w, h, zero)}`),
    ].map((it) => ctx.local(ctx.type, it, 's'))
    const weights = [
      `(1.0 - ${u}) * (1.0 - ${v})`,
      `${u} * (1.0 - ${v})`,
      `(1.0 - ${u}) * ${v}`,
      `${u} * ${v}`,
    ].map((it) => ctx.local('float', it, 'w'))
    if (this.mean === undefined) {
      return `(${samples.map((s, i) => `${s} * ${weights[i]}`).join(' + ')})`
    }
    const m = ctx.value(this.mean)
    const sum = samples.map((s, i) => `(${s} - ${m}) * ${weights[i]}`).join(' + ')
    const norm = ctx.call('sqrt', weights.map((it) => `${it} * ${it}`).join(' + '))
    return `(${m} + (${sum}) / ${norm})`
  }

  public evaluate(ctx: EvalContext, x: number, y: number, z: number, out: Float64Array): void {
    const w = ctx.value(this.width)
    const h = ctx.value(this.height)
    const qx = x - w * Math.floor(x / w)
    const qy = y - h * Math.floor(y / h)
    const u = smooth(qx / w)
    const v = smooth(qy / h)
    const [a, b, c, d] = this.buffers
    this.source.evaluate(ctx, qx, qy, z, a)
    this.source.evaluate(ctx, qx - w, qy, z, b)
    this.source.evaluate(ctx, qx, qy - h, z, c)
    this.source.evaluate(ctx, qx - w, qy - h, z, d)
    const weights = this.weights
    weights[0] = (1 - u) * (1 - v)
    weights[1] = u * (1 - v)
    weights[2] = (1 - u) * v
    weights[3] = u * v
    const hasMean = this.mean !== undefined
    const m = hasMean ? ctx.value(this.mean) : 0
    const norm = hasMean ? Math.sqrt(weights[0] ** 2 + weights[1] ** 2 + weights[2] ** 2 + weights[3] ** 2) : 1
    for (let l = 0; l < this.channels; l++) {
      const sum = (a[l] - m) * weights[0] + (b[l] - m) * weights[1] + (c[l] - m) * weights[2] + (d[l] - m) * weights[3]
      out[l] = m + sum / norm
    }
  }
}

/**
 * Makes the source tile seamlessly with a period of `size` in x and y, starting at the origin. Bake a region that
 * is a multiple of the period, e.g. `[0, 0, size, size]`
 *
 * @public
 * @remarks
 * Blends four copies of the source, shifted by the period, by the position in the period. The values and slopes
 * match where the texture repeats. Works for any graph and costs four samples of the source. Apply it to scalar noise before `remap` or `gradient`, blended colors look muddy.
 * Patterns that already repeat with the period, e.g. tiles of integer size, are not changed.
 *
 * @example
 * ```ts
 * perlin().pipe(scale(4), fbm({ octaves: 6 }), seamless(4, { mean: 0 }), remap(-0.7, 0.7, 0, 1))
 * ```
 */
export function seamless<S extends SeamlessSize, M extends Tunable = number>(size: S, options?: SeamlessOptions<M>) {
  return <P extends Params>(
    source: Field<P>,
  ): Field<P & ParamsOfInputs<S extends readonly unknown[] ? S : [S]> & ParamsOf<M>> =>
    new SeamlessField(source, size, options?.mean)
}
