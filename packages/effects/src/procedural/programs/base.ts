import { ShaderChunkSet, ShaderDefines, assembleShader } from '@gglib/graphics'
import { PROCEDURAL_CHUNKS } from '../chunks'

export function proceduralProgram(defines: ShaderDefines, extensions: ShaderChunkSet[] = []) {
  const template = PROCEDURAL_CHUNKS.programTemplate
  const chunks = [...Object.values(PROCEDURAL_CHUNKS).filter((it) => typeof it === 'object'), ...extensions]
  return {
    glsl: {
      vertex: assembleShader({
        template,
        chunks,
        defines: {
          ...defines,
          VERTEX_SHADER: true,
        },
      }),
      fragmen: assembleShader({
        template,
        chunks,
        defines: {
          ...defines,
          FRAGMENT_SHADER: true,
        },
      }),
    },
  }
}
