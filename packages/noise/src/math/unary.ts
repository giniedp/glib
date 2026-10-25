import type { EmitContext } from '../emit/EmitContext'
import type { EvalContext } from '../evaluate'
import { Field } from '../Field'
import type { Params } from '../types'

interface UnaryOp {
  emit: (ctx: EmitContext, value: string) => string
  cpu: (value: number) => number
}

// a builtin with the same name and meaning in WGSL and GLSL ES 3.00
function builtin(name: string, cpu: (value: number) => number): UnaryOp {
  return { emit: (ctx, value) => ctx.call(name, value), cpu }
}

const OPS = {
  abs: builtin('abs', Math.abs),
  negate: { emit: (ctx, value) => `(-${value})`, cpu: (value) => -value },
  sign: builtin('sign', Math.sign),
  floor: builtin('floor', Math.floor),
  ceil: builtin('ceil', Math.ceil),
  trunc: builtin('trunc', Math.trunc),
  // WGSL rounds halves to even, GLSL leaves it to the implementation. Halves up is the same everywhere
  round: { emit: (ctx, value) => ctx.call('floor', `${value} + 0.5`), cpu: (value) => Math.floor(value + 0.5) },
  fract: builtin('fract', (value) => value - Math.floor(value)),
  // GLSL has no saturate
  saturate: {
    emit: (ctx, value) => ctx.call('clamp', value, ctx.splat(ctx.float(0)), ctx.splat(ctx.float(1))),
    cpu: (value) => Math.min(Math.max(value, 0), 1),
  },
  sqrt: builtin('sqrt', Math.sqrt),
  // inverseSqrt in WGSL, inversesqrt in GLSL
  inverseSqrt: { emit: (ctx, value) => `(1.0 / ${ctx.call('sqrt', value)})`, cpu: (value) => 1 / Math.sqrt(value) },
  exp: builtin('exp', Math.exp),
  exp2: builtin('exp2', (value) => 2 ** value),
  log: builtin('log', Math.log),
  log2: builtin('log2', Math.log2),
  sin: builtin('sin', Math.sin),
  cos: builtin('cos', Math.cos),
  tan: builtin('tan', Math.tan),
  asin: builtin('asin', Math.asin),
  acos: builtin('acos', Math.acos),
  atan: builtin('atan', Math.atan),
  sinh: builtin('sinh', Math.sinh),
  cosh: builtin('cosh', Math.cosh),
  tanh: builtin('tanh', Math.tanh),
  asinh: builtin('asinh', Math.asinh),
  acosh: builtin('acosh', Math.acosh),
  atanh: builtin('atanh', Math.atanh),
  degrees: builtin('degrees', (value) => (value * 180) / Math.PI),
  radians: builtin('radians', (value) => (value * Math.PI) / 180),
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
 * Sign of the value: `-1`, `0` or `1`
 * @public
 */
export const sign = unary('sign')

/**
 * Rounds the value down, e.g. for terraces after scaling
 * @public
 */
export const floor = unary('floor')

/**
 * Rounds the value up
 * @public
 */
export const ceil = unary('ceil')

/**
 * Rounds the value towards zero
 * @public
 */
export const trunc = unary('trunc')

/**
 * Rounds the value to the nearest integer, halves up: `floor(x + 0.5)`
 * @public
 */
export const round = unary('round')

/**
 * Fractional part `x - floor(x)`, e.g. for repeating ramps after scaling
 * @public
 */
export const fract = unary('fract')

/**
 * Limits the value to `[0, 1]`
 * @public
 */
export const saturate = unary('saturate')

/**
 * Square root of the value
 * @public
 */
export const sqrt = unary('sqrt')

/**
 * Reciprocal of the square root `1 / sqrt(x)`
 * @public
 */
export const inverseSqrt = unary('inverseSqrt')

/**
 * Natural exponential `e^x`
 * @public
 */
export const exp = unary('exp')

/**
 * Base 2 exponential `2^x`
 * @public
 */
export const exp2 = unary('exp2')

/**
 * Natural logarithm
 * @public
 */
export const log = unary('log')

/**
 * Base 2 logarithm
 * @public
 */
export const log2 = unary('log2')

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
 * Tangent of the value
 * @public
 */
export const tan = unary('tan')

/**
 * Arc sine of the value in [-1, 1]
 * @public
 */
export const asin = unary('asin')

/**
 * Arc cosine of the value in [-1, 1]
 * @public
 */
export const acos = unary('acos')

/**
 * Arc tangent of the value
 * @public
 */
export const atan = unary('atan')

/**
 * Hyperbolic sine of the value
 * @public
 */
export const sinh = unary('sinh')

/**
 * Hyperbolic cosine of the value
 * @public
 */
export const cosh = unary('cosh')

/**
 * Hyperbolic tangent of the value, e.g. a soft limit to [-1, 1]
 * @public
 */
export const tanh = unary('tanh')

/**
 * Inverse hyperbolic sine of the value
 * @public
 */
export const asinh = unary('asinh')

/**
 * Inverse hyperbolic cosine of the value, defined for values >= 1
 * @public
 */
export const acosh = unary('acosh')

/**
 * Inverse hyperbolic tangent of the value in (-1, 1)
 * @public
 */
export const atanh = unary('atanh')

/**
 * Converts the value from radians to degrees
 * @public
 */
export const degrees = unary('degrees')

/**
 * Converts the value from degrees to radians
 * @public
 */
export const radians = unary('radians')
