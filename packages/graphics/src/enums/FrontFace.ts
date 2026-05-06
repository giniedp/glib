import { GLConst as gl } from './GLConst'

export type FrontFace = 'CW' | 'CCW'

const mapToWebGL: Record<FrontFace, number> = {
  CW: gl.CW,
  CCW: gl.CCW,
}

const mapFromWebGL: Record<number, FrontFace> = {
  [gl.CW]: 'CW',
  [gl.CCW]: 'CCW',
}

const mapToWebGPU: Record<FrontFace, GPUFrontFace> = {
  CW: 'cw',
  CCW: 'ccw',
}

export function frontFaceToWebGL(face: FrontFace): number {
  return mapToWebGL[face]
}

export function frontFaceFromWebGL(face: number): FrontFace {
  return mapFromWebGL[face]
}

export function frontFaceToWebGPU(face: FrontFace): GPUFrontFace {
  return mapToWebGPU[face]
}
