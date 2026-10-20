import type { Field } from './Field'
import { isUniform } from './Uniform'
import type { FieldInput, Tunable, UniformValue, Vec3, Vec4 } from './types'

/**
 * Evaluates fields on the CPU, see `Field.evaluate`
 *
 * @public
 * @remarks
 * Values are written into 4 element buffers. Fields with 1 channel only write the first element,
 * {@link EvalContext.sample} broadcasts it to all four.
 */
export class EvalContext {
  /**
   * Shared instance, the context holds no state
   */
  public static readonly default = new EvalContext()

  /**
   * Samples a field at the given point into `out`, all four channels
   */
  public sample(field: Field<any>, x: number, y: number, z: number, out: Float64Array): void {
    field.evaluate(this, x, y, z, out)
    if (field.channels === 1) {
      out[1] = out[0]
      out[2] = out[0]
      out[3] = out[0]
    }
  }

  /**
   * Samples the first channel of a field at the given point
   */
  public scalar(field: Field<any>, x: number, y: number, z: number, buffer: Float64Array): number {
    field.evaluate(this, x, y, z, buffer)
    return buffer[0]
  }

  /**
   * Writes the value of an input into `out`, all four channels: a field sampled at the point or a constant
   */
  public input(input: FieldInput, x: number, y: number, z: number, out: Float64Array): void {
    if (typeof input === 'number') {
      out.fill(input)
      return
    }
    if (isUniform(input) || Array.isArray(input)) {
      writeValue(isUniform(input) ? input.value : input, out)
      return
    }
    this.sample(input as Field<any>, x, y, z, out)
  }

  /**
   * Gets the current value of a scalar input
   */
  public value(input: Tunable): number {
    return isUniform(input) ? input.value : input
  }

  /**
   * Number of iterations of `EmitContext.loop` with the same arguments
   */
  public iterations(count: Tunable, maxCount: number): number {
    return Math.max(0, Math.min(Math.ceil(this.value(count)), maxCount))
  }

  /**
   * Gets one component of a vector input. A scalar applies to all components
   */
  public component(input: Tunable<number | Vec3 | Vec4>, index: number): number {
    const value: UniformValue = isUniform(input) ? input.value : input
    return typeof value === 'number' ? value : value[index]
  }
}

function writeValue(value: UniformValue, out: Float64Array) {
  if (typeof value === 'number') {
    out.fill(value)
    return
  }
  // field inputs are scalars or vec4
  out[0] = value[0]
  out[1] = value[1]
  out[2] = value[2]
  out[3] = value[3]
}

/**
 * Samples the first channel of a field on the CPU
 *
 * @public
 */
export function sample(field: Field<any>, x: number, y: number, z = 0): number {
  return field.sample(x, y, z)
}

/**
 * Samples all four channels of a field on the CPU
 *
 * @public
 */
export function sampleColor(field: Field<any>, x: number, y: number, z = 0, out?: Vec4): Vec4 {
  return field.sampleColor(x, y, z, out)
}
