import { GLConst as gl } from './GLConst'

export type StencilOperation =
  | 'Keep'
  | 'Zero'
  | 'Replace'
  | 'Invert'
  | 'IncrementClamp'
  | 'DecrementClamp'
  | 'IncrementWrap'
  | 'DecrementWrap'

const mapToWebGL: Record<StencilOperation, number> = {
  Keep: gl.KEEP,
  Zero: gl.ZERO,
  Replace: gl.REPLACE,
  Invert: gl.INVERT,
  IncrementClamp: gl.INCR,
  DecrementClamp: gl.DECR,
  IncrementWrap: gl.INCR_WRAP,
  DecrementWrap: gl.DECR_WRAP,
}

const mapToWebGPU: Record<StencilOperation, GPUStencilOperation> = {
  Keep: 'keep',
  Zero: 'zero',
  Replace: 'replace',
  Invert: 'invert',
  IncrementClamp: 'increment-clamp',
  DecrementClamp: 'decrement-clamp',
  IncrementWrap: 'increment-wrap',
  DecrementWrap: 'decrement-wrap',
}

export function stencilOperationToWebGL(op: StencilOperation): number {
  return mapToWebGL[op]
}

export function stencilOperationToWebGPU(op: StencilOperation): GPUStencilOperation {
  return mapToWebGPU[op]
}
