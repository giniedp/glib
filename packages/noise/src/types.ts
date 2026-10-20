import type { Field } from './Field'
import type { Uniform } from './Uniform'

/**
 * A 2 component vector
 * @public
 */
export type Vec2 = [number, number]

/**
 * A 3 component vector
 * @public
 */
export type Vec3 = [number, number, number]

/**
 * A 4 component vector
 * @public
 */
export type Vec4 = [number, number, number, number]

/**
 * Value of a uniform
 * @public
 */
export type UniformValue = number | Vec2 | Vec3 | Vec4

/**
 * Current values of the uniforms of a field by name
 * @public
 */
export type Params = Record<string, UniformValue>

/**
 * An input that is either a constant or a uniform that can be tweaked without recompiling the shader
 * @public
 */
export type Tunable<V extends UniformValue = number> = V | Uniform<string, V>

/**
 * An input that is a field, sampled at the same point, or a scalar or vec4 {@link Tunable}
 * @public
 */
export type FieldInput = Field<any> | Tunable | Tunable<Vec4>

/**
 * A function that takes a field and returns a new field, see {@link pipe}
 * @public
 */
export type Operator<A extends Params, B extends Params> = (source: Field<A>) => Field<B>

type UnionToIntersection<U> = (U extends unknown ? (u: U) => void : never) extends (i: infer I) => void ? I : never

/**
 * The params that an input contributes to a field
 * @public
 */
export type ParamsOf<T> = T extends Uniform<infer N, infer V> ? { [K in N]: V } : T extends Field<infer P> ? P : {}

/**
 * The params of all values of an options object
 * @public
 */
export type ParamsOfOptions<O> = O extends object ? UnionToIntersection<ParamsOf<O[keyof O]>> : {}

/**
 * The params of all items of a list of inputs
 * @public
 */
export type ParamsOfInputs<T extends readonly unknown[]> = UnionToIntersection<ParamsOf<T[number]>>
