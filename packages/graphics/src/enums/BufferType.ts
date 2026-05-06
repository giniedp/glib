import { GLConst as gl } from './GLConst'

export type BufferType = 'VertexBuffer' | 'IndexBuffer' | 'UniformBuffer'

const mapToWebGL: Record<BufferType, number> = {
  VertexBuffer: gl.ARRAY_BUFFER,
  IndexBuffer: gl.ELEMENT_ARRAY_BUFFER,
  UniformBuffer: gl.UNIFORM_BUFFER,
}

export function bufferTypeToWebGL(hint: BufferType): number {
  return mapToWebGL[hint]
}

export function bufferTypeToWebGpu(hint: BufferType): number {
  return mapToWebGL[hint]
}
