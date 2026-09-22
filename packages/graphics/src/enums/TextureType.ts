import { GLConst as gl } from './GLConst'

export type TextureType = Extract<
  GPUTextureViewDimension,
  '1d' | '2d' | '2d-array' | '3d' | 'cube'
  // |'cube-array'
>

export const mapToWebGL: Record<TextureType, number> = {
  '1d': gl.TEXTURE_2D,
  '2d': gl.TEXTURE_2D,
  '3d': gl.TEXTURE_3D,
  cube: gl.TEXTURE_CUBE_MAP,
  '2d-array': gl.TEXTURE_2D_ARRAY,
  // 'cube-array': null,
}

export const mapToWebGPUDimension: Record<TextureType, GPUTextureDimension> = {
  '1d': '1d',
  '2d': '2d',
  '3d': '3d',
  cube: '2d',
  '2d-array': '2d',
  // 'cube-array': '2d',
}

export function textureTypeToWebGL(type: TextureType): number {
  return mapToWebGL[type]
}

export function textureTypeToWebGPUDimension(type: TextureType): GPUTextureDimension {
  return mapToWebGPUDimension[type]
}
