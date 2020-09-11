import { ShaderDefines, assembleProgram, ShaderChunkSet } from "@gglib/graphics"

import {
  TEMPLATE,
  CHUNK_BASE_MAIN,
  CHUNK_COMMON,
  CHUNK_NOISE_CELL,
  CHUNK_NOISE_CELL_3D,
  CHUNK_NOISE_CLASSIC,
  CHUNK_NOISE_CLASSIC_3D,
  CHUNK_NOISE_SIMPLEX,
  CHUNK_NOISE_SIMPLEX_3D,
  CHUNK_UTILS
} from '../chunks'

const chunks = [
  CHUNK_BASE_MAIN,
  CHUNK_COMMON,
  CHUNK_NOISE_CELL,
  CHUNK_NOISE_CELL_3D,
  CHUNK_NOISE_CLASSIC,
  CHUNK_NOISE_CLASSIC_3D,
  CHUNK_NOISE_SIMPLEX,
  CHUNK_NOISE_SIMPLEX_3D,
  CHUNK_UTILS
]

export function proceduralProgram(defines: ShaderDefines, extensions: ShaderChunkSet[] = []) {
  return assembleProgram(TEMPLATE, [...chunks, ...extensions], defines)
}
