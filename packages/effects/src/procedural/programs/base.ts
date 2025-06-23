import { assembleProgram, ShaderChunkSet, ShaderDefines } from '@gglib/graphics'
import { PROCEDURAL_CHUNKS } from '../chunks'

export function proceduralProgram(defines: ShaderDefines, extensions: ShaderChunkSet[] = []) {
  const template = PROCEDURAL_CHUNKS.programTemplate
  const chunks = [...Object.values(PROCEDURAL_CHUNKS).filter((it) => typeof it === 'object'), ...extensions]
  return assembleProgram({
    template,
    chunks,
    defines,
  })
}
