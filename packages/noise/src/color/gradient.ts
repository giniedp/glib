import type { EmitContext } from '../emit/EmitContext'
import type { EvalContext } from '../evaluate'
import { Field } from '../Field'
import type { Params, ParamsOfInputs, Tunable, Vec4 } from '../types'
import { type ColorInput, toColor } from './parse'

/**
 * A stop of a {@link gradient}: the position and the color at that position
 * @public
 */
export type GradientStop = readonly [Tunable, ColorInput]

interface ResolvedStop {
  position: Tunable
  color: Tunable<Vec4>
}

/**
 * Maps the first channel of the source to a color
 * @public
 */
export class GradientField extends Field<any> {
  public readonly kind = 'gradient'
  public readonly stops: ReadonlyArray<ResolvedStop>
  private readonly sourceBuffer = new Float64Array(4)
  private readonly colorBuffer = new Float64Array(4)

  public constructor(
    public readonly source: Field<any>,
    stops: ReadonlyArray<GradientStop>,
  ) {
    if (!stops.length) {
      throw new Error('A gradient needs at least one stop')
    }
    const resolved = stops.map(([position, color]) => ({ position, color: toColor(color) }))
    super(
      [source],
      resolved.flatMap((it) => [it.position, it.color]),
      4,
    )
    this.stops = resolved
  }

  public emit(ctx: EmitContext): string {
    const stops = this.stops
    const value = ctx.local('float', ctx.scalar(this.source), 'v')
    const color = ctx.local('vec4', ctx.input(stops[0].color), 'color')
    // blend towards each next stop, clamping makes the chain piecewise linear without branches
    for (let i = 1; i < stops.length; i++) {
      const t0 = ctx.value(stops[i - 1].position)
      const t1 = ctx.value(stops[i].position)
      const t = ctx.call('clamp', `(${value} - ${t0}) / (${t1} - ${t0})`, ctx.float(0), ctx.float(1))
      ctx.assign(color, ctx.call('mix', color, ctx.input(stops[i].color), t))
    }
    return color
  }

  public evaluate(ctx: EvalContext, x: number, y: number, z: number, out: Float64Array): void {
    const stops = this.stops
    const c = this.colorBuffer
    const value = ctx.scalar(this.source, x, y, z, this.sourceBuffer)
    ctx.input(stops[0].color, x, y, z, out)
    for (let i = 1; i < stops.length; i++) {
      const t0 = ctx.value(stops[i - 1].position)
      const t1 = ctx.value(stops[i].position)
      const t = Math.min(Math.max((value - t0) / (t1 - t0), 0), 1)
      ctx.input(stops[i].color, x, y, z, c)
      for (let l = 0; l < 4; l++) {
        out[l] = out[l] * (1 - t) + c[l] * t
      }
    }
  }
}

/**
 * Maps the value (its first channel) to a color, interpolating linearly between stops with increasing positions.
 * Positions and colors can be uniforms
 * @public
 * @example
 * ```ts
 * clouds.pipe(gradient([[0, '#0b1d51'], [0.5, '#6aa5ff'], [1, '#ffffff']]))
 * ```
 */
export function gradient<S extends ReadonlyArray<GradientStop>>(stops: S) {
  return <P extends Params>(source: Field<P>): Field<P & ParamsOfInputs<Array<S[number][number]>>> =>
    new GradientField(source, stops)
}
