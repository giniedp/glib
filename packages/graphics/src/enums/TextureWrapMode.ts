import { GLConst as gl } from './GLConst'

export type TextureWrapMode = Extract<GPUAddressMode, 'clamp-to-edge' | 'mirror-repeat' | 'repeat'>

const mapToWebGL: Record<TextureWrapMode, number> = {
  repeat: gl.REPEAT,
  'clamp-to-edge': gl.CLAMP_TO_EDGE,
  'mirror-repeat': gl.MIRRORED_REPEAT,
}

const mapFromWebGL: Record<number, TextureWrapMode> = {
  [gl.REPEAT]: 'repeat',
  [gl.CLAMP_TO_EDGE]: 'clamp-to-edge',
  [gl.MIRRORED_REPEAT]: 'mirror-repeat',
}

export function textureWrapModeToWebGL(mode: TextureWrapMode): number {
  return mapToWebGL[mode]
}

export function textureWrapModeFromWebGL(mode: number): TextureWrapMode {
  return mapFromWebGL[mode]
}
