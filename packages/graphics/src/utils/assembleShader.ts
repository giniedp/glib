import { ShaderProgramOptions } from '../resources'

/**
 * A shader code snippet
 *
 * @public
 */
export type ShaderChunk = string

/**
 * A map of shader code snippets
 *
 * @public
 */
export type ShaderChunkSet<T = void> = Record<string, ShaderChunk>

/**
 * A map of `#define` statements for a shader
 *
 * @public
 * @remarks
 * - Use `true` values to indicate a simple define statement: `#define KEY`
 * - Use `false`, `null`, `undefined` to indicate absence of a define statement
 * - Use other values to indicate a define statement with value: `#define KEY VALUE`
 *
 * Example:
 * ```
 * const defines: ShaderDefines = { foo: true, bar: null, baz: 1234 }
 * ```
 *
 * will be interpreted as
 * ```
 * #define foo
 * #define baz 1234
 * ```
 */
export type ShaderDefines = Record<string, any>

export interface AssembleProgramOptions {
  template: string
  chunks: ShaderChunkSet[]
  defines?: ShaderDefines
}

/**
 * Combines a set of shader chunks into `vertexShader` and `fragmentShader` source files
 *
 * @public
 */
export function assembleProgram({ template, chunks, defines }: AssembleProgramOptions): ShaderProgramOptions {
  // prettier-ignore
  return {
    vertexShader: build(template, [
      { defines: '#define VERTEX_SHADER' },
      buildDefinesChunk(defines),
      ...chunks,
    ]),
    fragmentShader: build(template, [
      { defines: '#define FRAGMENT_SHADER' },
      buildDefinesChunk(defines),
      ...chunks,
    ]),
  }
}

function define(key: string, value?: any): string {
  if (value === true) {
    return `#define ${key}`
  }
  if (value != null && value !== false) {
    return `#define ${key} ${value}`
  }
  return ''
}

function buildDefinesChunk(defines: ShaderDefines): ShaderChunkSet {
  return {
    defines: Object.keys(defines || {})
      .sort()
      .map((k) => define(k, defines[k]))
      .filter((it) => it)
      .join('\n'),
  }
}

function build(template: string, blocks: ShaderChunkSet[], prefix: string = ''): string {
  const result: string[] = []

  const blockRegx = /^(\s*)#pragma block:(\w+)(\s*)$/
  for (const line of template.split('\n')) {
    const match = line.match(blockRegx)
    if (match) {
      const indent = match[1]
      const slot = match[2]
      const before = `${slot}_before`
      const after = `${slot}_after`
      for (const block of blocks) {
        if (before in block) {
          result.push(build(block[before], blocks, prefix + indent))
        }
      }
      for (const block of blocks) {
        if (slot in block) {
          result.push(build(block[slot], blocks, prefix + indent))
        }
      }
      for (const block of blocks) {
        if (after in block) {
          result.push(build(block[after], blocks, prefix + indent))
        }
      }
    } else {
      result.push(prefix + line)
    }
  }
  return result.join('\n').replace(/(\s*\n)+/g, '\n') + '\n'
}
