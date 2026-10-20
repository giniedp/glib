import type { UniformValue, Vec2, Vec3, Vec4 } from './types'

/**
 * Type of a uniform in the generated shader
 * @public
 */
export type UniformType = 'f32' | 'vec2' | 'vec3' | 'vec4'

/**
 * Options of a {@link uniform}, e.g. to configure a slider
 * @public
 */
export interface UniformOptions {
  min?: number
  max?: number
  step?: number
}

const TYPE_BY_LENGTH: Record<number, UniformType> = { 2: 'vec2', 3: 'vec3', 4: 'vec4' }
const IDENTIFIER = /^[A-Za-z][A-Za-z0-9_]*$/

/**
 * A named input of a field that can be changed without recompiling the shader
 *
 * @public
 * @remarks
 * Create it with {@link uniform}. Uniforms are identified by name: uniforms with the same name in one graph share
 * their value, see `Field.params`.
 */
export class Uniform<N extends string = string, V extends UniformValue = UniformValue> {
  /**
   * The type in the generated shader
   */
  public readonly type: UniformType
  /**
   * The current value
   */
  public value: V

  public constructor(
    public readonly name: N,
    public readonly defaultValue: V,
    public readonly options: UniformOptions = {},
  ) {
    if (!IDENTIFIER.test(name)) {
      throw new Error(`Invalid uniform name '${name}', use letters, digits and '_'`)
    }
    this.type = uniformType(defaultValue)
    this.value = copyValue(defaultValue)
  }
}

/**
 * Creates a uniform input
 *
 * @public
 * @param name - name of the uniform, uniforms with the same name share their value
 * @param value - the default value
 * @example
 * ```ts
 * const field = perlin().pipe(fbm({ octaves: 6, gain: uniform('gain', 0.5, { min: 0, max: 1 }) }))
 * field.params.gain = 0.7
 * ```
 */
export function uniform<N extends string>(name: N, value: number, options?: UniformOptions): Uniform<N, number>
export function uniform<N extends string>(name: N, value: Vec2, options?: UniformOptions): Uniform<N, Vec2>
export function uniform<N extends string>(name: N, value: Vec3, options?: UniformOptions): Uniform<N, Vec3>
export function uniform<N extends string>(name: N, value: Vec4, options?: UniformOptions): Uniform<N, Vec4>
export function uniform(name: string, value: UniformValue, options?: UniformOptions): Uniform {
  return new Uniform(name, value, options)
}

/**
 * Whether the value is a {@link Uniform}
 * @public
 */
export function isUniform(value: unknown): value is Uniform {
  return value instanceof Uniform
}

/**
 * Gets the shader type of a uniform value
 * @public
 */
export function uniformType(value: UniformValue): UniformType {
  if (typeof value === 'number') {
    return 'f32'
  }
  const type = TYPE_BY_LENGTH[value.length]
  if (!type) {
    throw new Error(`Unsupported uniform value with ${value.length} components`)
  }
  return type
}

/**
 * Copies a uniform value, so that vectors are not shared by reference
 * @public
 */
export function copyValue<V extends UniformValue>(value: V): V {
  return (typeof value === 'number' ? value : [...(value as number[])]) as V
}

/**
 * Whether two uniform values are equal
 * @public
 */
export function valueEquals(a: UniformValue, b: UniformValue): boolean {
  if (typeof a === 'number' || typeof b === 'number') {
    return a === b
  }
  return a.length === b.length && a.every((it, i) => it === b[i])
}
