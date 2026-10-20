import type { EmitContext } from '../emit/EmitContext'
import type { EvalContext } from '../evaluate'
import { Field } from '../Field'
import type { Params } from '../types'

interface UnaryOp {
  emit: (ctx: EmitContext, value: string) => string
  cpu: (value: number) => number
}

const OPS = {
  abs: { emit: (ctx, value) => ctx.call('abs', value), cpu: Math.abs },
  negate: { emit: (ctx, value) => `(-${value})`, cpu: (value) => -value },
  sin: { emit: (ctx, value) => ctx.call('sin', value), cpu: Math.sin },
  cos: { emit: (ctx, value) => ctx.call('cos', value), cpu: Math.cos },
  floor: { emit: (ctx, value) => ctx.call('floor', value), cpu: Math.floor },
} satisfies Record<string, UnaryOp>

/**
 * Name of a unary math function
 * @public
 */
export type UnaryOpName = keyof typeof OPS

/**
 * Applies a unary math function to the source
 * @public
 */
export class UnaryField extends Field<any> {
  private readonly op: UnaryOp

  public constructor(
    public readonly kind: UnaryOpName,
    public readonly source: Field<any>,
  ) {
    super([source])
    this.op = OPS[kind]
  }

  public emit(ctx: EmitContext): string {
    return this.op.emit(ctx, ctx.sample(this.source))
  }

  public evaluate(ctx: EvalContext, x: number, y: number, z: number, out: Float64Array): void {
    this.source.evaluate(ctx, x, y, z, out)
    const cpu = this.op.cpu
    for (let l = 0; l < this.channels; l++) {
      out[l] = cpu(out[l])
    }
  }
}

function unary(kind: UnaryOpName) {
  return () =>
    <P extends Params>(source: Field<P>): Field<P> =>
      new UnaryField(kind, source)
}

/**
 * Absolute value, e.g. turns noise into turbulence
 * @public
 */
export const abs = unary('abs')

/**
 * Negates the value
 * @public
 */
export const negate = unary('negate')

/**
 * Sine of the value, e.g. for marble like stripes
 * @public
 */
export const sin = unary('sin')

/**
 * Cosine of the value
 * @public
 */
export const cos = unary('cos')

/**
 * Rounds the value down, e.g. for terraces after scaling
 * @public
 */
export const floor = unary('floor')
