import { GLConst as gl } from './GLConst'

export type PrimitiveType = Extract<
  GPUPrimitiveTopology,
  'line-list' | 'line-strip' | 'point-list' | 'triangle-list' | 'triangle-strip'
>

const mapToWebGL: Record<PrimitiveType, number> = {
  'point-list': gl.POINTS,
  'line-list': gl.LINES,
  'line-strip': gl.LINE_STRIP,
  'triangle-list': gl.TRIANGLES,
  'triangle-strip': gl.TRIANGLE_STRIP,
}

const mapFromWebGL: Record<number, PrimitiveType> = {
  [gl.POINTS]: 'point-list',
  [gl.LINES]: 'line-list',
  [gl.LINE_STRIP]: 'line-strip',
  [gl.TRIANGLES]: 'triangle-list',
  [gl.TRIANGLE_STRIP]: 'triangle-strip',
}

export function primitiveTypeToWebGL(type: PrimitiveType): number {
  return mapToWebGL[type]
}

export function primitiveTypeFromWebGL(type: number): PrimitiveType {
  return mapFromWebGL[type]
}
