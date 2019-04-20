import { ShaderProgramOptions } from '@gglib/graphics'
import { glsl } from './glsl'

export interface ShaderPart {
  [key: string]: string
}

export interface ShaderBlocks {
  [key: string]: string[]
}

export function buildVertexShader(base: string, blocks: ShaderPart[], defines?: { [key: string]: any }): string {
  return buildShader(base, [{ defines: glsl`#define VERTEX_SHADER` }, ...blocks], defines)
}

export function buildFragmentShader(base: string, blocks: ShaderPart[], defines?: { [key: string]: any }): string {
  return buildShader(base, [{ defines: glsl`#define FRAGMENT_SHADER` }, ...blocks], defines)
}

export function buildProgram(base: string, blocks: ShaderPart[], defines?: { [key: string]: any }): ShaderProgramOptions {
  return {
    vertexShader: buildVertexShader(base, blocks, defines),
    fragmentShader: buildFragmentShader(base, blocks, defines),
  }
}

export function buildShader(base: string, blocks: ShaderPart[], defines: { [key: string]: any } = {}): string {
  const defs = Object.keys(defines).sort().map((k) => {
    const def = defines[k]
    if (def === true) {
      return `#define ${k}`
    }
    if (def) {
      return `#define ${k} ${def}`
    }
  }).filter((it) => it)

  const blk = blocks.map((it) => {
    const r: ShaderBlocks = {}
    Object.keys(it).sort().forEach((k) => {
      r[k] = it[k].split('\n')
    })
    return r
  })

  return build(base.split('\n'), [{ defines: defs }, ...blk])
}

export function build(base: string[], blocks: ShaderBlocks[], prefix: string = ''): string {
  const result: string[] = []

  const blockRegx = /^(\s*)#pragma block:(\w+)(\s*)$/
  for (const line of base) {
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
