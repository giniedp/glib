export type TextureFilter = 'Nearest' | 'Linear'
export type MipmapFilter = 'None' | 'Nearest' | 'Linear'
import { GLConst as gl } from './GLConst'

const minMipFromWebgl: Record<number, { minFilter: TextureFilter; mipFilter: MipmapFilter }> = {
  [gl.NEAREST]: { minFilter: 'Nearest', mipFilter: 'None' },
  [gl.LINEAR]: { minFilter: 'Linear', mipFilter: 'None' },
  [gl.NEAREST_MIPMAP_NEAREST]: { minFilter: 'Nearest', mipFilter: 'Nearest' },
  [gl.LINEAR_MIPMAP_NEAREST]: { minFilter: 'Linear', mipFilter: 'Nearest' },
  [gl.NEAREST_MIPMAP_LINEAR]: { minFilter: 'Nearest', mipFilter: 'Linear' },
  [gl.LINEAR_MIPMAP_LINEAR]: { minFilter: 'Linear', mipFilter: 'Linear' },
}

const filterFromWebgl: Record<number, TextureFilter> = {
  [gl.NEAREST]: 'Nearest',
  [gl.LINEAR]: 'Linear',
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
