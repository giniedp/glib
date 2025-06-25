import { GLConst as gl } from './GLConst'

export type BufferType = 'VertexBuffer' | 'IndexBuffer'

const mapToWebGL: Record<BufferType, number> = {
  VertexBuffer: gl.ARRAY_BUFFER,
  IndexBuffer: gl.ELEMENT_ARRAY_BUFFER,
}

export function bufferTypeToWebGL(hint: BufferType): number {
  return mapToWebGL[hint]
}
