import type { Primitive } from './Primitive'

/**
 * Types used by generated noise code
 * @public
 */
export type ShaderType = 'float' | 'vec2' | 'vec3' | 'vec4' | 'int' | 'uint'

/**
 * Options for the uniform block of the generated code
 * @public
 */
export interface UniformBlockOptions {
  blockName: string
  instanceName: string
  group: number
  binding: number
}

/**
 * The syntax of one shading language. All language differences of the emitter live in its implementations
 *
 * @public
 */
export interface Syntax {
  readonly language: 'wgsl' | 'glsl'
  /**
   * Name of a type
   */
  type(type: ShaderType): string
  /**
   * Constructor expression of a vector
   */
  vector(type: 'vec2' | 'vec3' | 'vec4', args: string[]): string
  /**
   * Conversion of an integer expression to float
   */
  toFloat(expr: string): string
  /**
   * Statement that declares a mutable local variable
   */
  declare(name: string, type: ShaderType, expr: string): string
  /**
   * Head of a counting loop `for (i = 0; i < count; i++) {`
   */
  loop(index: string, count: number): string
  /**
   * A function definition
   */
  function(name: string, params: Array<[string, ShaderType]>, returns: ShaderType, body: string[]): string
  /**
   * Declaration of the uniform block
   */
  uniformBlock(fields: Array<[string, ShaderType]>, options: UniformBlockOptions): string
  /**
   * Source code of a primitive in this language
   */
  primitive(primitive: Primitive): string
}

const WGSL_TYPES: Record<ShaderType, string> = {
  float: 'f32',
  vec2: 'vec2f',
  vec3: 'vec3f',
  vec4: 'vec4f',
  int: 'i32',
  uint: 'u32',
}

const GLSL_TYPES: Record<ShaderType, string> = {
  float: 'float',
  vec2: 'vec2',
  vec3: 'vec3',
  vec4: 'vec4',
  int: 'int',
  uint: 'uint',
}

/**
 * WGSL syntax
 * @public
 */
export class WgslSyntax implements Syntax {
  public readonly language = 'wgsl'

  public type(type: ShaderType): string {
    return WGSL_TYPES[type]
  }

  public vector(type: 'vec2' | 'vec3' | 'vec4', args: string[]): string {
    return `${this.type(type)}(${args.join(', ')})`
  }

  public toFloat(expr: string): string {
    return `f32(${expr})`
  }

  public declare(name: string, type: ShaderType, expr: string): string {
    return `var ${name}: ${this.type(type)} = ${expr};`
  }

  public loop(index: string, count: number): string {
    return `for (var ${index} = 0; ${index} < ${count}; ${index}++) {`
  }

  public function(name: string, params: Array<[string, ShaderType]>, returns: ShaderType, body: string[]): string {
    const args = params.map(([param, type]) => `${param}: ${this.type(type)}`).join(', ')
    return [`fn ${name}(${args}) -> ${this.type(returns)} {`, ...body, '}'].join('\n')
  }

  public uniformBlock(fields: Array<[string, ShaderType]>, options: UniformBlockOptions): string {
    return [
      `struct ${options.blockName} {`,
      ...fields.map(([name, type]) => `  ${name}: ${this.type(type)},`),
      '}',
      `@group(${options.group}) @binding(${options.binding}) var<uniform> ${options.instanceName}: ${options.blockName};`,
    ].join('\n')
  }

  public primitive(primitive: Primitive): string {
    return primitive.wgsl
  }
}

/**
 * GLSL ES 3.00 syntax
 * @public
 */
export class GlslSyntax implements Syntax {
  public readonly language = 'glsl'

  public type(type: ShaderType): string {
    return GLSL_TYPES[type]
  }

  public vector(type: 'vec2' | 'vec3' | 'vec4', args: string[]): string {
    return `${this.type(type)}(${args.join(', ')})`
  }

  public toFloat(expr: string): string {
    return `float(${expr})`
  }

  public declare(name: string, type: ShaderType, expr: string): string {
    return `${this.type(type)} ${name} = ${expr};`
  }

  public loop(index: string, count: number): string {
    return `for (int ${index} = 0; ${index} < ${count}; ${index}++) {`
  }

  public function(name: string, params: Array<[string, ShaderType]>, returns: ShaderType, body: string[]): string {
    const args = params.map(([param, type]) => `${this.type(type)} ${param}`).join(', ')
    return [`${this.type(returns)} ${name}(${args}) {`, ...body, '}'].join('\n')
  }

  public uniformBlock(fields: Array<[string, ShaderType]>, options: UniformBlockOptions): string {
    return [
      // GL reflects block members by block name, the annotation lets gglib resolve them by instance name
      `// @block ${options.instanceName}`,
      `layout(std140) uniform ${options.blockName} {`,
      ...fields.map(([name, type]) => `  ${this.type(type)} ${name};`),
      `} ${options.instanceName};`,
    ].join('\n')
  }

  public primitive(primitive: Primitive): string {
    return primitive.glsl
  }
}

/**
 * Formats a number as float literal that is valid in WGSL and GLSL
 * @public
 */
export function formatFloat(value: number): string {
  if (!Number.isFinite(value)) {
    throw new Error(`Cannot emit ${value} as shader literal`)
  }
  const text = Number.isInteger(value) ? value.toFixed(1) : String(value)
  return value < 0 ? `(${text})` : text
}
