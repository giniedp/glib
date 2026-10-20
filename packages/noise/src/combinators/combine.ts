import type { EmitContext } from '../emit/EmitContext'
import type { EvalContext } from '../evaluate'
import { Field, maxChannelsOf } from '../Field'
import type { FieldInput, Params, ParamsOfInputs } from '../types'

interface CombineOp {
  emit: (ctx: EmitContext, a: string, b: string) => string
  cpu: (a: number, b: number) => number
}

const OPS = {
  add: { emit: (ctx, a, b) => `(${a} + ${b})`, cpu: (a, b) => a + b },
  sub: { emit: (ctx, a, b) => `(${a} - ${b})`, cpu: (a, b) => a - b },
  mul: { emit: (ctx, a, b) => `(${a} * ${b})`, cpu: (a, b) => a * b },
  min: { emit: (ctx, a, b) => ctx.call('min', a, b), cpu: Math.min },
  max: { emit: (ctx, a, b) => ctx.call('max', a, b), cpu: Math.max },
} satisfies Record<string, CombineOp>

/**
 * Name of a combining operation
 * @public
 */
export type CombineOpName = keyof typeof OPS

/**
 * Combines the source with other inputs, from left to right
 * @public
 */
export class CombineField extends Field<any> {
  private readonly op: CombineOp
  private readonly buffer = new Float64Array(4)

  public constructor(
    public readonly kind: CombineOpName,
    public readonly source: Field<any>,
    public readonly others: ReadonlyArray<FieldInput>,
  ) {
    super([source, ...others.filter((it) => it instanceof Field)], others, maxChannelsOf([source, ...others]))
    this.op = OPS[kind]
  }

  public emit(ctx: EmitContext): string {
    let result = ctx.sample(this.source)
    for (const other of this.others) {
      result = this.op.emit(ctx, result, ctx.input(other))
    }
    return result
  }

  public evaluate(ctx: EvalContext, x: number, y: number, z: number, out: Float64Array): void {
    const lanes = this.channels
    const cpu = this.op.cpu
    const b = this.buffer
    ctx.sample(this.source, x, y, z, out)
    for (let i = 0; i < this.others.length; i++) {
      ctx.input(this.others[i], x, y, z, b)
      for (let l = 0; l < lanes; l++) {
        out[l] = cpu(out[l], b[l])
      }
    }
  }
}

function combinator(kind: CombineOpName) {
  return <T extends FieldInput[]>(...others: T) =>
    <P extends Params>(source: Field<P>): Field<P & ParamsOfInputs<T>> =>
      new CombineField(kind, source, others)
}

/**
 * Adds fields, numbers or uniforms to the value
 * @public
 */
export const add = combinator('add')

/**
 * Subtracts fields, numbers or uniforms from the value
 * @public
 */
export const sub = combinator('sub')

/**
 * Multiplies the value by fields, numbers or uniforms
 * @public
 */
export const mul = combinator('mul')

/**
 * The minimum of the value and fields, numbers or uniforms
 * @public
 */
export const min = combinator('min')

/**
 * The maximum of the value and fields, numbers or uniforms
 * @public
 */
export const max = combinator('max')
