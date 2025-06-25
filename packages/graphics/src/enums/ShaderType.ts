import { GLConst as gl } from './GLConst'

export type ShaderType = 'VertexShader' | 'FragmentShader' | 'ComputeShader'

const mapToWebGL: Record<ShaderType, number> = {
  VertexShader: gl.VERTEX_SHADER,
  FragmentShader: gl.FRAGMENT_SHADER,
  ComputeShader: null,
}

export function shaderTypeToWebGL(type: ShaderType): number {
  return mapToWebGL[type]
}
