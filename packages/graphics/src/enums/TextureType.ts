import { GLConst as gl } from './GLConst'

export type TextureType = 'Texture2D' | 'Texture3D' | 'TextureCube' | 'Texture2DArray'

export const mapToWebGL: Record<TextureType, number> = {
  Texture2D: gl.TEXTURE_2D,
  Texture3D: gl.TEXTURE_3D,
  TextureCube: gl.TEXTURE_CUBE_MAP,
  Texture2DArray: gl.TEXTURE_2D_ARRAY,
}

export const mapToWebGPU: Record<TextureType, GPUTextureViewDimension> = {
  Texture2D: '2d',
  Texture3D: '3d',
  TextureCube: 'cube',
  Texture2DArray: '2d-array',
}

export const mapToWebGPUDimension: Record<TextureType, GPUTextureDimension> = {
  Texture2D: '2d',
  Texture3D: '3d',
  TextureCube: '2d',
  Texture2DArray: '2d',
}

export function textureTypeToWebGL(type: TextureType): number {
  return mapToWebGL[type]
}

export function textureTypeToWebGPU(type: TextureType): GPUTextureViewDimension {
  return mapToWebGPU[type]
}

export function textureTypeToWebGPUDimension(type: TextureType): GPUTextureDimension {
  return mapToWebGPUDimension[type]
}
