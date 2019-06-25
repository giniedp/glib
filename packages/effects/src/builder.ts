import { ShaderProgramOptions } from '@gglib/graphics'
import { glsl } from './glsl'

/**
 * A simple string, a part of shader source code
 *
 * @public
 */
export type ShaderChunk = string

/**
 * Maps slot names to a ShaderChunk
 *
 * @public
 */
export interface ShaderChunkSet {
  [key: string]: ShaderChunk
}

/**
 * ShaderDefines maps a defined KEY to its defined VALUE
 *
 * @public
 * @remarks
 * - Defines with `true` values are defined as `#define KEY`
 * - Defines with falsy values (`false`, `null`, `undefined`) are ignored.
 * - Everything else is defined as `#define KEY VALUE`
 *
 * ```
 * const defines = { foo: true, bar: null, baz: 1234 }
 * ```
 *
 * will resolve in
 * ```
 * #define foo
 * #define baz 1234
 * ```
 */
export interface ShaderDefines {
  [key: string]: any
}

export function buildProgram(base: string, chunks: ShaderChunkSet[], defines?: ShaderDefines): ShaderProgramOptions {
  return {
    vertexShader: buildShader(base, [{ defines: glsl`#define VERTEX_SHADER` }, ...chunks], defines),
    fragmentShader: buildShader(base, [{ defines: glsl`#define FRAGMENT_SHADER` }, ...chunks], defines),
  }
}

/**
 *
 * @public
 * @param base
 * @param chunks
 * @param defines
 */
export function buildShader(base: string, chunks: ShaderChunkSet[], defines: ShaderDefines = {}): string {
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
