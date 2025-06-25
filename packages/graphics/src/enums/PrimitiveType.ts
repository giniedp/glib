import { GLConst as gl } from './GLConst'

export type PrimitiveType = 'PointList' | 'LineList' | 'LineStrip' | 'TriangleList' | 'TriangleStrip'

const mapToWebGL: Record<PrimitiveType, number> = {
  PointList: gl.POINTS,
  LineList: gl.LINES,
  LineStrip: gl.LINE_STRIP,
  TriangleList: gl.TRIANGLES,
  TriangleStrip: gl.TRIANGLE_STRIP,
}

const mapFromWebGL: Record<number, PrimitiveType> = {
  [gl.POINTS]: 'PointList',
  [gl.LINES]: 'LineList',
  [gl.LINE_STRIP]: 'LineStrip',
  [gl.TRIANGLES]: 'TriangleList',
  [gl.TRIANGLE_STRIP]: 'TriangleStrip',
}

const mapToWebGPU: Record<PrimitiveType, GPUPrimitiveTopology> = {
  PointList: 'point-list',
  LineList: 'line-list',
  LineStrip: 'line-strip',
  TriangleList: 'triangle-list',
  TriangleStrip: 'triangle-strip',
}

export function primitiveTypeToWebGL(type: PrimitiveType): number {
  return mapToWebGL[type]
}

export function primitiveTypeFromWebGL(type: number): PrimitiveType {
  return mapFromWebGL[type]
}

export function primitiveTypeToWebGPU(type: PrimitiveType): GPUPrimitiveTopology {
  return mapToWebGPU[type]
}
