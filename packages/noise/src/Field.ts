import type { EmitContext } from './emit/EmitContext'
import { EvalContext } from './evaluate'
import { type Uniform, isUniform, valueEquals } from './Uniform'
import type { FieldInput, Params, Vec4 } from './types'

type AnyField = Field<any>
type Op<A, B> = (source: A) => B

function maxChannels(fields: ReadonlyArray<AnyField>): Channels {
  return fields.some((it) => it.channels === 4) ? 4 : 1
}

/**
 * Number of channels of an input: fields have their own, vec4 constants and uniforms have 4, scalars 1
 * @public
 */
export function channelsOf(input: FieldInput): Channels {
  if (input instanceof Field) {
    return input.channels
  }
  if (typeof input === 'number') {
    return 1
  }
  const value = isUniform(input) ? input.value : input
  return typeof value === 'number' ? 1 : 4
}

/**
 * The most channels of a list of inputs
 * @public
 */
export function maxChannelsOf(inputs: ReadonlyArray<FieldInput>): Channels {
  return inputs.some((it) => channelsOf(it) === 4) ? 4 : 1
}

/**
 * Number of channels a field computes: `1` is a scalar that stands for the vec4 `(v, v, v, v)`, `4` is a color
 * @public
 */
export type Channels = 1 | 4

/**
 * A node of a noise graph: a function of a 3D point that returns a vec4
 *
 * @public
 * @remarks
 * Fields are immutable. Compose them with operators, see {@link pipe}. Each field implements its own shader code
 * in {@link Field.emit} and its own CPU code in {@link Field.evaluate}, so new fields can be added without changing
 * the emitters.
 *
 * Every field is a vec4. A field that only depends on scalar fields has {@link Field.channels} `1`: it computes one
 * value that stands for all four channels. That keeps grayscale graphs as cheap as scalar code on CPU and GPU.
 */
export abstract class Field<P extends Params = {}> {
  /**
   * Phantom type of the params, never set
   */
  declare public readonly __params?: P

  /**
   * Short name of the field kind, used to name the generated shader function
   */
  public abstract readonly kind: string

  /**
   * The fields this field samples
   */
  public readonly children: ReadonlyArray<AnyField>

  /**
   * The uniforms this field uses directly
   */
  public readonly uniforms: ReadonlyArray<Uniform>

  /**
   * Number of computed channels, `1` stands for the vec4 `(v, v, v, v)`
   */
  public readonly channels: Channels

  private paramsObject: P | null = null
  private uniformsByName: Map<string, Uniform[]> | null = null
  private readonly result = new Float64Array(4)

  /**
   * @param children - the fields this field samples
   * @param inputs - the inputs of this field, uniforms among them are collected
   * @param channels - the computed channels, defaults to the most channels of the children
   */
  protected constructor(
    children: ReadonlyArray<AnyField>,
    inputs: ReadonlyArray<unknown> = [],
    channels: Channels = maxChannels(children),
  ) {
    this.children = children
    this.uniforms = inputs.filter(isUniform)
    this.channels = channels
  }

  /**
   * Returns the shader expression of this field at the point `ctx.p`, of type `ctx.type`
   */
  public abstract emit(ctx: EmitContext): string

  /**
   * Writes the value of this field at the given point into the first {@link Field.channels} elements of `out`
   */
  public abstract evaluate(ctx: EvalContext, x: number, y: number, z: number, out: Float64Array): void

  /**
   * Returns an expression that replaces the call of this field's function, or `null` to emit a function.
   * Only for fields that don't depend on the point, e.g. constants
   */
  public emitInline(ctx: EmitContext): string | null {
    return null
  }

  /**
   * Current values of all uniforms of this graph by name. Setting a value updates all uniforms with that name
   */
  public get params(): P {
    this.paramsObject ??= createParams(this.uniformMap())
    return this.paramsObject
  }

  /**
   * All uniforms of this graph, one per name
   */
  public get uniformList(): Uniform[] {
    return Array.from(this.uniformMap().values(), (it) => it[0])
  }

  /**
   * Samples the first channel of this field on the CPU, e.g. a height
   */
  public sample(x: number, y: number, z = 0): number {
    this.evaluate(EvalContext.default, x, y, z, this.result)
    return this.result[0]
  }

  /**
   * Samples all four channels of this field on the CPU
   */
  public sampleColor(x: number, y: number, z = 0, out: Vec4 = [0, 0, 0, 0]): Vec4 {
    const result = this.result
    EvalContext.default.sample(this, x, y, z, result)
    out[0] = result[0]
    out[1] = result[1]
    out[2] = result[2]
    out[3] = result[3]
    return out
  }

  /**
   * Applies operators to this field, same as `pipe(field, ...operators)`
   */
  public pipe(): this
  public pipe<A>(op1: Op<this, A>): A
  public pipe<A, B>(op1: Op<this, A>, op2: Op<A, B>): B
  public pipe<A, B, C>(op1: Op<this, A>, op2: Op<A, B>, op3: Op<B, C>): C
  public pipe<A, B, C, D>(op1: Op<this, A>, op2: Op<A, B>, op3: Op<B, C>, op4: Op<C, D>): D
  public pipe<A, B, C, D, E>(op1: Op<this, A>, op2: Op<A, B>, op3: Op<B, C>, op4: Op<C, D>, op5: Op<D, E>): E
  public pipe<A, B, C, D, E, F>(
    op1: Op<this, A>,
    op2: Op<A, B>,
    op3: Op<B, C>,
    op4: Op<C, D>,
    op5: Op<D, E>,
    op6: Op<E, F>,
  ): F
  public pipe<A, B, C, D, E, F, G>(
    op1: Op<this, A>,
    op2: Op<A, B>,
    op3: Op<B, C>,
    op4: Op<C, D>,
    op5: Op<D, E>,
    op6: Op<E, F>,
    op7: Op<F, G>,
  ): G
  public pipe(...ops: Array<Op<AnyField, AnyField>>): AnyField
  public pipe(...ops: Array<Op<any, any>>): any {
    return pipeFromArray(this, ops)
  }

  private uniformMap(): Map<string, Uniform[]> {
    this.uniformsByName ??= collectUniforms(this)
    return this.uniformsByName
  }
}

/**
 * Applies operators to a field, from left to right
 *
 * @public
 * @example
 * ```ts
 * const terrain = pipe(perlin(), scale(4), fbm({ octaves: 6 }), clamp(0, 1))
 * ```
 */
export function pipe<S extends AnyField>(source: S): S
export function pipe<S extends AnyField, A>(source: S, op1: Op<S, A>): A
export function pipe<S extends AnyField, A, B>(source: S, op1: Op<S, A>, op2: Op<A, B>): B
export function pipe<S extends AnyField, A, B, C>(source: S, op1: Op<S, A>, op2: Op<A, B>, op3: Op<B, C>): C
export function pipe<S extends AnyField, A, B, C, D>(
  source: S,
  op1: Op<S, A>,
  op2: Op<A, B>,
  op3: Op<B, C>,
  op4: Op<C, D>,
): D
export function pipe<S extends AnyField, A, B, C, D, E>(
  source: S,
  op1: Op<S, A>,
  op2: Op<A, B>,
  op3: Op<B, C>,
  op4: Op<C, D>,
  op5: Op<D, E>,
): E
export function pipe<S extends AnyField, A, B, C, D, E, F>(
  source: S,
  op1: Op<S, A>,
  op2: Op<A, B>,
  op3: Op<B, C>,
  op4: Op<C, D>,
  op5: Op<D, E>,
  op6: Op<E, F>,
): F
export function pipe<S extends AnyField, A, B, C, D, E, F, G>(
  source: S,
  op1: Op<S, A>,
  op2: Op<A, B>,
  op3: Op<B, C>,
  op4: Op<C, D>,
  op5: Op<D, E>,
  op6: Op<E, F>,
  op7: Op<F, G>,
): G
export function pipe(source: AnyField, ...ops: Array<Op<AnyField, AnyField>>): AnyField
export function pipe(source: AnyField, ...ops: Array<Op<AnyField, AnyField>>): AnyField {
  return pipeFromArray(source, ops)
}

function pipeFromArray(source: AnyField, ops: ReadonlyArray<Op<AnyField, AnyField>>): AnyField {
  let result = source
  for (const op of ops) {
    result = op(result)
  }
  return result
}

/**
 * Collects all uniforms of a graph by name
 *
 * @public
 * @remarks
 * Throws if uniforms with the same name differ in type or default value.
 */
export function collectUniforms(root: AnyField): Map<string, Uniform[]> {
  const result = new Map<string, Uniform[]>()
  visitUniforms(root, new Set(), result)
  return result
}

// children first, so uniforms are listed in pipe order: the uniforms of the source before those of its operators
function visitUniforms(field: AnyField, visited: Set<AnyField>, result: Map<string, Uniform[]>) {
  if (visited.has(field)) {
    return
  }
  visited.add(field)
  for (const child of field.children) {
    visitUniforms(child, visited, result)
  }
  for (const uniform of field.uniforms) {
    addUniform(result, uniform)
  }
}

function addUniform(map: Map<string, Uniform[]>, uniform: Uniform) {
  const list = map.get(uniform.name)
  if (!list) {
    map.set(uniform.name, [uniform])
    return
  }
  if (list.includes(uniform)) {
    return
  }
  const first = list[0]
  if (first.type !== uniform.type || !valueEquals(first.defaultValue, uniform.defaultValue)) {
    throw new Error(`Uniform '${uniform.name}' is declared twice with a different type or default value`)
  }
  list.push(uniform)
}

function createParams<P>(uniforms: Map<string, Uniform[]>): P {
  const params = {}
  for (const [name, list] of uniforms) {
    Object.defineProperty(params, name, {
      enumerable: true,
      get: () => list[0].value,
      set: (value) => {
        for (const uniform of list) {
          uniform.value = value
        }
      },
    })
  }
  return params as P
}
