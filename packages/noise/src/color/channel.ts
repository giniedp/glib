import type { EmitContext } from '../emit/EmitContext'
import type { EvalContext } from '../evaluate'
import { Field } from '../Field'
import type { Params } from '../types'

/**
 * Index of a channel: 0 red, 1 green, 2 blue, 3 alpha
 * @public
 */
export type ChannelIndex = 0 | 1 | 2 | 3

const SWIZZLE = ['x', 'y', 'z', 'w'] as const

/**
 * Extracts one channel of the source
 * @public
 */
export class ChannelField extends Field<any> {
  public readonly kind = 'channel'
  private readonly buffer = new Float64Array(4)

  public constructor(
    public readonly source: Field<any>,
    public readonly index: ChannelIndex,
  ) {
    super([source], [], 1)
  }

  public emit(ctx: EmitContext): string {
    const value = ctx.sample(this.source)
    // a scalar source is the same in all channels
    if (this.source.channels === 1) {
      return value
    }
    return `${value}.${SWIZZLE[this.index]}`
  }

  public evaluate(ctx: EvalContext, x: number, y: number, z: number, out: Float64Array): void {
    const b = this.buffer
    ctx.sample(this.source, x, y, z, b)
    out[0] = b[this.index]
  }
}

/**
 * Extracts one channel of a color, e.g. to use a color field as mask or height
 * @public
 */
export function channel(index: ChannelIndex) {
  return <P extends Params>(source: Field<P>): Field<P> => new ChannelField(source, index)
}
