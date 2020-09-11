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
export interface ShaderChunkSet<T = void> {
  [key: string]: ShaderChunk
}

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
export interface ShaderDefines {
  [key: string]: any
}

/**
 * Combines a set of shader chunks into a single shader source file
 *
 * @public
 * @param base - The initial chunk to process
 * @param chunks - A map of available shader chunks to include
 * @param defines - A map of shader defines to include
 */
export function assembleShader(base: string, chunks: ShaderChunkSet[], defines: ShaderDefines = {}): string {
  const defs = Object.keys(defines).sort().map((k) => {
    const value = defines[k]
    if (value === true) {
      return `#define ${k}`
    }
    if (value != null && value !== false) {
      return `#define ${k} ${value}`
    }
  }).filter((it) => it).join('\n')

  return build(base, [{ defines: defs }, ...chunks])
}

function build(base: string, blocks: ShaderChunkSet[], prefix: string = ''): string {
  const result: string[] = []

  const blockRegx = /^(\s*)#pragma block:(\w+)(\s*)$/
  for (const line of base.split('\n')) {
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

/**
 * Combines a set of shader chunks into `vertexShader` and `fragmentShader` source files
 *
 * @public
 * @param base - The initial chunk to process
 * @param chunks - A map of available shader chunks to include
 * @param defines - A map of shader defines to include
 */
export function assembleProgram(base: string, chunks: ShaderChunkSet[], defines?: ShaderDefines): ShaderProgramOptions {
  return {
    vertexShader: assembleShader(base, [{ defines: '#define VERTEX_SHADER' }, ...chunks], defines),
    fragmentShader: assembleShader(base, [{ defines: '#define FRAGMENT_SHADER' }, ...chunks], defines),
  }
}
