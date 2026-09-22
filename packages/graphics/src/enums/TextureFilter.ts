export type TextureFilter = Extract<GPUFilterMode, 'linear' | 'nearest'>
export type MipmapFilter = null | Extract<GPUMipmapFilterMode, 'linear' | 'nearest'>
import { GLConst as gl } from './GLConst'

const minMipFromWebgl: Record<number, { minFilter: TextureFilter; mipFilter: MipmapFilter }> = {
  [gl.NEAREST]: { minFilter: 'nearest', mipFilter: null },
  [gl.LINEAR]: { minFilter: 'linear', mipFilter: null },
  [gl.NEAREST_MIPMAP_NEAREST]: { minFilter: 'nearest', mipFilter: 'nearest' },
  [gl.LINEAR_MIPMAP_NEAREST]: { minFilter: 'linear', mipFilter: 'nearest' },
  [gl.NEAREST_MIPMAP_LINEAR]: { minFilter: 'nearest', mipFilter: 'linear' },
  [gl.LINEAR_MIPMAP_LINEAR]: { minFilter: 'linear', mipFilter: 'linear' },
}

const filterFromWebgl: Record<number, TextureFilter> = {
  [gl.NEAREST]: 'nearest',
  [gl.LINEAR]: 'linear',
}

export function magFilterFromWebGL(filter: number): TextureFilter {
  return filterFromWebgl[filter] || null
}

export function minFilterFromWebGL(filter: number): TextureFilter {
  return minMipFromWebgl[filter]?.minFilter || null
}

export function mipFilterFromWebGL(filter: number): MipmapFilter {
  return minMipFromWebgl[filter]?.mipFilter || null
}
