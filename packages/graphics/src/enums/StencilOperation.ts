import { GLConst as gl } from './GLConst'

export type StencilOperation = Extract<
  GPUStencilOperation,
  'decrement-clamp' | 'decrement-wrap' | 'increment-clamp' | 'increment-wrap' | 'invert' | 'keep' | 'replace' | 'zero'
>

const mapToWebGL: Record<StencilOperation, number> = {
  keep: gl.KEEP,
  zero: gl.ZERO,
  replace: gl.REPLACE,
  invert: gl.INVERT,
  'increment-clamp': gl.INCR,
  'decrement-clamp': gl.DECR,
  'increment-wrap': gl.INCR_WRAP,
  'decrement-wrap': gl.DECR_WRAP,
}

const mapFromWebGl = Object.fromEntries(
  Object.entries(mapToWebGL).map(([key, value]) => [value, key as StencilOperation]),
)

export function stencilOperationToWebGL(op: StencilOperation): number {
  return mapToWebGL[op]
}

export function stencilOperationFromWebGL(op: number): StencilOperation {
  return mapFromWebGl[op]
}
