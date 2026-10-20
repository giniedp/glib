import type { EmitContext } from '../emit/EmitContext'
import type { Primitive } from '../emit/Primitive'
import type { EvalContext } from '../evaluate'
import { Field } from '../Field'
import { perlin3, perlinPrimitive } from '../lib/perlin'
import { simplex3, simplexPrimitive } from '../lib/simplex'
import { value3, valuePrimitive } from '../lib/value'

/**
 * A field that calls a noise primitive
 *
 * @public
 */
export class NoiseField extends Field {
  public constructor(
    public readonly kind: string,
    private readonly primitive: Primitive,
    private readonly cpu: (x: number, y: number, z: number) => number,
  ) {
    super([])
  }

  public emit(ctx: EmitContext): string {
    return ctx.call(ctx.use(this.primitive), ctx.p)
  }

  public evaluate(ctx: EvalContext, x: number, y: number, z: number, out: Float64Array): void {
    out[0] = this.cpu(x, y, z)
  }
}

/**
 * Gradient (perlin) noise in about [-1, 1] with a feature size of 1
 * @public
 */
export function perlin(): Field {
  return new NoiseField('perlin', perlinPrimitive, perlin3)
}

/**
 * Simplex noise in about [-1, 1] with a feature size of about 1
 * @public
 */
export function simplex(): Field {
  return new NoiseField('simplex', simplexPrimitive, simplex3)
}

/**
 * Value noise in [-1, 1] with a feature size of 1
 * @public
 */
export function value(): Field {
  return new NoiseField('value', valuePrimitive, value3)
}
