import { GLConst as gl } from './GLConst'

export type ShaderType = 'vertex' | 'fragment' | 'compute'

const mapToWebGL: Record<ShaderType, number> = {
  vertex: gl.VERTEX_SHADER,
  fragment: gl.FRAGMENT_SHADER,
  compute: null,
}

export function shaderTypeToWebGL(type: ShaderType): number {
  return mapToWebGL[type]
}
