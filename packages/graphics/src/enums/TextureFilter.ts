import { GLConst as gl } from './GLConst'

export type TextureFilter =
  | 'Nearest'
  | 'Linear'
  | 'NearestMipmapNearest'
  | 'LinearMipmapNearest'
  | 'NearestMipmapLinear'
  | 'LinearMipmapLinear'

const mapToWebGL: Record<TextureFilter, number> = {
  Nearest: gl.NEAREST,
  Linear: gl.LINEAR,
  NearestMipmapNearest: gl.NEAREST_MIPMAP_NEAREST,
  LinearMipmapNearest: gl.LINEAR_MIPMAP_NEAREST,
  NearestMipmapLinear: gl.NEAREST_MIPMAP_LINEAR,
  LinearMipmapLinear: gl.LINEAR_MIPMAP_LINEAR,
}

const mapFromWebGL: Record<number, TextureFilter> = {
  [gl.NEAREST]: 'Nearest',
  [gl.LINEAR]: 'Linear',
  [gl.NEAREST_MIPMAP_NEAREST]: 'NearestMipmapNearest',
  [gl.LINEAR_MIPMAP_NEAREST]: 'LinearMipmapNearest',
  [gl.NEAREST_MIPMAP_LINEAR]: 'NearestMipmapLinear',
  [gl.LINEAR_MIPMAP_LINEAR]: 'LinearMipmapLinear',
}

export function textureFilterToWebGL(filter: TextureFilter): number {
  return mapToWebGL[filter]
}

export function textureFilterFromWebGL(filter: number): TextureFilter {
  return mapFromWebGL[filter]
}
