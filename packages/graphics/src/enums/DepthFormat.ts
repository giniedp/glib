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

const mapToWebGPU: Record<DepthFormat, GPUTextureFormat> = {
  None: 'stencil8',
  DepthStencil: 'depth24plus-stencil8',
  Depth16: 'depth16unorm',
  Depth24: 'depth24plus',
  Depth32: 'depth32float',
  Depth24Stencil8: 'depth24plus-stencil8',
  Depth32Stencil8: 'depth32float-stencil8',
}

export function depthFormatToWebGL(format: DepthFormat): number {
  return mapToWebGL[format]
}

export function depthFormatToWebGPU(format: DepthFormat): GPUTextureFormat {
  return mapToWebGPU[format]
}
