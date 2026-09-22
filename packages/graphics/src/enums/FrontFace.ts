import { GLConst as gl } from './GLConst'

export type FrontFace = Extract<GPUFrontFace, 'cw' | 'ccw'>

const mapToWebGL: Record<FrontFace, number> = {
  cw: gl.CW,
  ccw: gl.CCW,
}

const mapFromWebGL: Record<number, FrontFace> = {
  [gl.CW]: 'cw',
  [gl.CCW]: 'ccw',
}

export function frontFaceToWebGL(face: FrontFace): number {
  return mapToWebGL[face]
}

export function frontFaceFromWebGL(face: number): FrontFace {
  return mapFromWebGL[face]
}
