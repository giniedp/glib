import { GLConst as gl } from './GLConst'

export const BufferUsage = {
  MAP_READ: 1,
  MAP_WRITE: 2,
  COPY_SRC: 4,
  COPY_DST: 8,
  INDEX: 16,
  VERTEX: 32,
  UNIFORM: 64,
  STORAGE: 128,
  INDIRECT: 256,
  QUERY_RESOLVE: 512,
} satisfies GPUBufferUsage

export function bufferUsageToWebGL(usage: number): number {
  if (usage & BufferUsage.VERTEX) {
    return gl.ARRAY_BUFFER
  }
  if (usage & BufferUsage.INDEX) {
    return gl.ELEMENT_ARRAY_BUFFER
  }
  if (usage & BufferUsage.UNIFORM) {
    return gl.UNIFORM_BUFFER
  }
  if (usage & BufferUsage.STORAGE) {
    // WebGL has no storage buffers, the data is mirrored into a float texture. A generic target holds the data
    return gl.COPY_WRITE_BUFFER
  }
  throw new Error(`Buffer usage not supported: ${usage}`)
}
