import { GLConst as gl } from './GLConst'

export type BufferUsageHint = 'Static' | 'Dynamic' | 'Stream'

const mapToWebGL: Record<BufferUsageHint, number> = {
  Static: gl.STATIC_DRAW,
  Dynamic: gl.DYNAMIC_DRAW,
  Stream: gl.STREAM_DRAW,
}
