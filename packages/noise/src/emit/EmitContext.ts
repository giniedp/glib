import type { Field } from '../Field'
import type { FieldInput, Tunable, Vec3 } from '../types'
import type { Primitive } from './Primitive'
import type { ShaderType } from './Syntax'

/**
 * Builds the shader function of one field, see `Field.emit`
 *
 * @public
 * @remarks
 * Fields only build code through this context, it hides the differences between WGSL and GLSL.
 * Expressions are returned as strings, statements are added to the function body.
 */
export interface EmitContext {
  /**
   * Name of the point parameter, a 3 component vector
   */
  readonly p: string

  /**
   * Type of the field function: `float` for 1 channel, `vec4` for 4 channels
   */
  readonly type: 'float' | 'vec4'

  /**
   * Returns an expression that samples a field at a point, `p` by default.
   * The expression has the type of this function, a scalar field is promoted to vec4
   */
  sample(field: Field<any>, point?: string): string

  /**
   * Returns a float expression of the first channel of a field at a point, `p` by default
   */
  scalar(field: Field<any>, point?: string): string

  /**
   * Returns an expression of an input in the type of this function: a field sampled at the point,
   * `p` by default, or a scalar or vec4 constant or uniform
   */
  input(input: FieldInput, point?: string): string

  /**
   * Returns a float expression of a scalar input: a literal or a uniform. Mixes with vec4 in arithmetic,
   * use {@link EmitContext.splat} for function arguments
   */
  value(input: Tunable): string

  /**
   * Promotes a float expression to the type of this function
   */
  splat(expr: string): string

  /**
   * Returns a vec4 constructor expression
   */
  vec4(x: string, y: string, z: string, w: string): string

  /**
   * Returns a 3 component vector expression of an input, a scalar applies to all components
   */
  vector(input: Tunable<number | Vec3>): string

  /**
   * Returns a float literal
   */
  float(value: number): string

  /**
   * Returns a vector constructor expression
   */
  vec3(x: string, y: string, z: string): string

  /**
   * Returns a function call expression
   */
  call(name: string, ...args: string[]): string

  /**
   * Registers a primitive function and returns its name
   */
  use(primitive: Primitive): string

  /**
   * Declares a mutable local variable and returns its unique name
   */
  local(type: ShaderType, expr: string, hint?: string): string

  /**
   * Adds the statement `target = expr`
   */
  assign(target: string, expr: string): void

  /**
   * Adds a loop that runs `count` times. A uniform count is limited to `maxCount`
   */
  loop(count: Tunable, maxCount: number, body: () => void): void
}
