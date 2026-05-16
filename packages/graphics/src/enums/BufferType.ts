import { GLConst as gl } from './GLConst'

export type BufferType = 'VertexBuffer' | 'IndexBuffer' | 'UniformBuffer' | 'StorageBuffer'

const mapToWebGL: Record<BufferType, number> = {
  VertexBuffer: gl.ARRAY_BUFFER,
  IndexBuffer: gl.ELEMENT_ARRAY_BUFFER,
  UniformBuffer: gl.UNIFORM_BUFFER,
  StorageBuffer: null,
}

export function bufferTypeToWebGL(type: BufferType): number {
  if (type === 'StorageBuffer') {
    throw new Error('StorageBuffer is not supported in WebGL')
  }
  return mapToWebGL[type]
}
