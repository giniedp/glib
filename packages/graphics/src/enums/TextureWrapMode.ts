import { GLConst as gl } from './GLConst'

export type TextureWrapMode = 'Repeat' | 'Clamp' | 'Mirror'

const mapToWebGL: Record<TextureWrapMode, number> = {
  Repeat: gl.REPEAT,
  Clamp: gl.CLAMP_TO_EDGE,
  Mirror: gl.MIRRORED_REPEAT,
}

const mapFromWebGL: Record<number, TextureWrapMode> = {
  [gl.REPEAT]: 'Repeat',
  [gl.CLAMP_TO_EDGE]: 'Clamp',
  [gl.MIRRORED_REPEAT]: 'Mirror',
}

const mapToWebGPU: Record<TextureWrapMode, GPUAddressMode> = {
  Repeat: 'repeat',
  Clamp: 'clamp-to-edge',
  Mirror: 'mirror-repeat',
}

export function textureWrapModeToWebGL(mode: TextureWrapMode): number {
  return mapToWebGL[mode]
}

export function textureWrapModeFromWebGL(mode: number): TextureWrapMode {
  return mapFromWebGL[mode]
}

export function textureWrapModeToWebGPU(mode: TextureWrapMode): GPUAddressMode {
  return mapToWebGPU[mode]
}
