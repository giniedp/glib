import { GLConst as gl } from './GLConst'

export type DepthFormat =
  | 'None'
  | 'DepthStencil'
  | 'Depth16'
  | 'Depth24'
  | 'Depth32'
  | 'Depth24Stencil8'
  | 'Depth32Stencil8'

const mapToWebGL: Record<DepthFormat, number> = {
  None: gl.ZERO,
  DepthStencil: gl.DEPTH_STENCIL,
  Depth16: gl.DEPTH_COMPONENT16,
  Depth24: gl.DEPTH_COMPONENT24,
  Depth32: gl.DEPTH_COMPONENT32F,
  Depth24Stencil8: gl.DEPTH24_STENCIL8,
  Depth32Stencil8: gl.DEPTH32F_STENCIL8,
}

export function depthFormatToWebGL(format: DepthFormat): number {
  return mapToWebGL[format]
}
