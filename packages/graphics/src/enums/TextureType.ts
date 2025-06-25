import { GLConst as gl } from './GLConst'

export type TextureType = 'Texture' | 'Texture2D' | 'Texture3D' | 'TextureCube' | 'Texture2DArray'

export const mapToWebGL: Record<TextureType, number> = {
  Texture: gl.TEXTURE_2D,
  Texture2D: gl.TEXTURE_2D,
  Texture3D: gl.TEXTURE_3D,
  TextureCube: gl.TEXTURE_CUBE_MAP,
  Texture2DArray: gl.TEXTURE_2D_ARRAY,
}

export const mapToWebGPU: Record<TextureType, GPUTextureViewDimension> = {
  Texture: '2d',
  Texture2D: '2d',
  Texture3D: '3d',
  TextureCube: 'cube',
  Texture2DArray: '2d-array',
}

export function textureTypeToWebGL(type: TextureType): number {
  return mapToWebGL[type]
}

export function textureTypeToWebGPU(type: TextureType): GPUTextureViewDimension {
  return mapToWebGPU[type]
}
