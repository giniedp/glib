import { type Channels, channelsOf, collectUniforms, Field } from '../Field'
import { isUniform, type Uniform, type UniformOptions } from '../Uniform'
import type { FieldInput, Tunable, UniformValue, Vec3 } from '../types'
import type { EmitContext } from './EmitContext'
import type { Primitive } from './Primitive'
import { formatFloat, GlslSyntax, type ShaderType, type Syntax, WgslSyntax } from './Syntax'

/**
 * Options of {@link toWgsl} and {@link toGlsl}
 *
 * @public
 */
export interface EmitOptions {
  /**
   * Prefix of the generated field functions. Defaults to `noise`
   */
  prefix?: string
  /**
   * Name of the uniform block type. Defaults to `NoiseParams`
   */
  blockName?: string
  /**
   * Name of the uniform block instance, uniforms are accessed as `instance.name`. Defaults to `noise`
   */
  instanceName?: string
  /**
   * Bind group of the uniform block, WGSL only. Defaults to `0`
   */
  group?: number
  /**
   * Binding of the uniform block, WGSL only. Defaults to `0`
   */
  binding?: number
  /**
   * Emits the current values of uniforms as literals. `true` for all uniforms, or a list of names
   */
  inline?: boolean | string[]
}

/**
 * A uniform of the generated uniform block
 *
 * @public
 */
export interface UniformInfo {
  name: string
  type: ShaderType
  /**
   * Path to set the uniform on a gglib program, e.g. `noise.gain`
   */
  path: string
  /**
   * Byte offset in the uniform block (std140 / WGSL uniform layout)
   */
  offset: number
  default: UniformValue
  options: UniformOptions
}

/**
 * Generated shader code of a field
 *
 * @public
 */
export interface ShaderCode {
  /**
   * The uniform block, primitives and field functions
   */
  code: string
  /**
   * Name of the function to call, it takes a 3 component point and returns a value of {@link ShaderCode.type}
   */
  entry: string
  /**
   * Return type of the entry function. A `float` stands for the vec4 `(v, v, v, v)`
   */
  type: 'float' | 'vec4'
  /**
   * The uniforms in the uniform block, empty if all are inlined
   */
  uniforms: UniformInfo[]
  /**
   * Byte size of the uniform block, `0` without block
   */
  blockSize: number
}

/**
 * Generates WGSL code of a field
 *
 * @public
 */
export function toWgsl(field: Field<any>, options?: EmitOptions): ShaderCode {
  return new ProgramEmitter(new WgslSyntax(), options).build(field)
}

/**
 * Generates GLSL ES 3.00 code of a field
 *
 * @public
 */
export function toGlsl(field: Field<any>, options?: EmitOptions): ShaderCode {
  return new ProgramEmitter(new GlslSyntax(), options).build(field)
}

const LAYOUT: Record<ShaderType, { size: number; align: number }> = {
  float: { size: 4, align: 4 },
  int: { size: 4, align: 4 },
  uint: { size: 4, align: 4 },
  vec2: { size: 8, align: 8 },
  vec3: { size: 12, align: 16 },
  vec4: { size: 16, align: 16 },
}

const UNIFORM_TYPES: Record<Uniform['type'], ShaderType> = {
  f32: 'float',
  vec2: 'vec2',
  vec3: 'vec3',
  vec4: 'vec4',
}

const VECTOR_TYPES: Record<number, 'vec2' | 'vec3' | 'vec4'> = { 2: 'vec2', 3: 'vec3', 4: 'vec4' }

const CHANNEL_TYPES: Record<Channels, 'float' | 'vec4'> = { 1: 'float', 4: 'vec4' }

/**
 * Emits the functions of all fields of a graph
 */
class ProgramEmitter {
  private readonly prefix: string
  private readonly fieldFunctions = new Map<Field<any>, string>()
  private readonly functions: string[] = []
  private readonly primitives = new Map<string, Primitive>()
  private readonly uniforms = new Map<string, Uniform>()
  private counter = 0

  public constructor(
    private readonly syntax: Syntax,
    private readonly options: EmitOptions = {},
  ) {
    this.prefix = options.prefix ?? 'noise'
  }

  public build(root: Field<any>): ShaderCode {
    const entry = this.emitField(root)
    // list uniforms in graph order like Field.params, not in emit order. Also checks for conflicts
    const order = Array.from(collectUniforms(root).keys())
    const used = order.filter((name) => this.uniforms.has(name)).map((name) => this.uniforms.get(name))
    const { block, uniforms, size } = this.buildUniformBlock(used)
    const primitives = Array.from(this.primitives.values(), (it) => this.syntax.primitive(it).trim())
    const code = [block, ...primitives, ...this.functions].filter(Boolean).join('\n\n')
    return { code, entry, type: CHANNEL_TYPES[root.channels], uniforms, blockSize: size }
  }

  /**
   * Emits the function of a field, once per field, and returns its name
   */
  public emitField(field: Field<any>): string {
    let name = this.fieldFunctions.get(field)
    if (name) {
      return name
    }
    name = `${this.prefix}_${field.kind}_${this.counter++}`
    this.fieldFunctions.set(field, name)
    const ctx = new FunctionContext(this, this.syntax, CHANNEL_TYPES[field.channels])
    const result = field.emit(ctx)
    // children were emitted during field.emit, so they are defined before this function
    const body = [...ctx.body, `  return ${result};`]
    this.functions.push(this.syntax.function(name, [[ctx.p, 'vec3']], ctx.type, body))
    return name
  }

  public usePrimitive(primitive: Primitive): string {
    if (this.primitives.has(primitive.name)) {
      return primitive.name
    }
    for (const dep of primitive.deps ?? []) {
      this.usePrimitive(dep)
    }
    this.primitives.set(primitive.name, primitive)
    return primitive.name
  }

  public uniform(uniform: Uniform): string {
    if (this.isInlined(uniform)) {
      return this.literal(uniform.value)
    }
    this.uniforms.set(uniform.name, uniform)
    return `${this.instanceName}.${uniform.name}`
  }

  public literal(value: UniformValue): string {
    if (typeof value === 'number') {
      return formatFloat(value)
    }
    return this.syntax.vector(VECTOR_TYPES[value.length], value.map(formatFloat))
  }

  public nextName(hint: string): string {
    return `${hint}_${this.counter++}`
  }

  private get instanceName(): string {
    return this.options.instanceName ?? 'noise'
  }

  private isInlined(uniform: Uniform): boolean {
    const inline = this.options.inline
    return inline === true || (Array.isArray(inline) && inline.includes(uniform.name))
  }

  private buildUniformBlock(used: Uniform[]) {
    const uniforms: UniformInfo[] = []
    let offset = 0
    for (const uniform of used) {
      const type = UNIFORM_TYPES[uniform.type]
      const layout = LAYOUT[type]
      offset = Math.ceil(offset / layout.align) * layout.align
      uniforms.push({
        name: uniform.name,
        type,
        path: `${this.instanceName}.${uniform.name}`,
        offset,
        default: uniform.defaultValue,
        options: uniform.options,
      })
      offset += layout.size
    }
    if (!uniforms.length) {
      return { block: '', uniforms, size: 0 }
    }
    const block = this.syntax.uniformBlock(
      uniforms.map((it) => [it.name, it.type]),
      {
        blockName: this.options.blockName ?? 'NoiseParams',
        instanceName: this.instanceName,
        group: this.options.group ?? 0,
        binding: this.options.binding ?? 0,
      },
    )
    return { block, uniforms, size: Math.ceil(offset / 16) * 16 }
  }
}

/**
 * The {@link EmitContext} of one field function
 */
class FunctionContext implements EmitContext {
  public readonly p = 'p'
  public readonly body: string[] = []
  private indent = '  '

  public constructor(
    private readonly program: ProgramEmitter,
    private readonly syntax: Syntax,
    public readonly type: 'float' | 'vec4',
  ) {}

  public sample(field: Field<any>, point = this.p): string {
    const expr = this.fieldCall(field, point)
    return field.channels === 1 ? this.splat(expr) : expr
  }

  public scalar(field: Field<any>, point = this.p): string {
    const expr = this.fieldCall(field, point)
    return field.channels === 1 ? expr : `${expr}.x`
  }

  public input(input: FieldInput, point = this.p): string {
    if (input instanceof Field) {
      return this.sample(input, point)
    }
    const value = isUniform(input) ? this.program.uniform(input) : this.program.literal(input)
    return channelsOf(input) === 1 ? this.splat(value) : value
  }

  public value(input: Tunable): string {
    return isUniform(input) ? this.program.uniform(input) : formatFloat(input)
  }

  public splat(expr: string): string {
    return this.type === 'vec4' ? this.syntax.vector('vec4', [expr]) : expr
  }

  public vec4(x: string, y: string, z: string, w: string): string {
    return this.syntax.vector('vec4', [x, y, z, w])
  }

  /**
   * Call expression of a field function in its own type, or the inline expression
   */
  private fieldCall(field: Field<any>, point: string): string {
    return field.emitInline(this) ?? `${this.program.emitField(field)}(${point})`
  }

  public vector(input: Tunable<number | Vec3>): string {
    if (isUniform(input)) {
      const value = this.program.uniform(input)
      return input.type === 'f32' ? this.syntax.vector('vec3', [value]) : value
    }
    if (typeof input === 'number') {
      return this.syntax.vector('vec3', [formatFloat(input)])
    }
    return this.program.literal(input)
  }

  public float(value: number): string {
    return formatFloat(value)
  }

  public vec3(x: string, y: string, z: string): string {
    return this.syntax.vector('vec3', [x, y, z])
  }

  public call(name: string, ...args: string[]): string {
    return `${name}(${args.join(', ')})`
  }

  public use(primitive: Primitive): string {
    return this.program.usePrimitive(primitive)
  }

  public local(type: ShaderType, expr: string, hint = 'v'): string {
    const name = this.program.nextName(hint)
    this.body.push(this.indent + this.syntax.declare(name, type, expr))
    return name
  }

  public assign(target: string, expr: string): void {
    this.body.push(`${this.indent}${target} = ${expr};`)
  }

  public loop(count: Tunable, maxCount: number, body: () => void): void {
    const index = this.program.nextName('i')
    // a uniform count breaks at `i >= count`, which runs ceil(count) times like a constant count
    const bound = isUniform(count) ? maxCount : Math.min(Math.ceil(count), maxCount)
    this.body.push(this.indent + this.syntax.loop(index, bound))
    const outer = this.indent
    this.indent += '  '
    if (isUniform(count)) {
      this.body.push(`${this.indent}if (${this.syntax.toFloat(index)} >= ${this.value(count)}) { break; }`)
    }
    body()
    this.indent = outer
    this.body.push(`${outer}}`)
  }
}
