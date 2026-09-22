import { GLConst as gl } from './GLConst'

export type CullMode = Extract<GPUCullMode, 'back' | 'front' | 'none'>

const mapToWebGL: Record<CullMode, number> = {
  front: gl.FRONT,
  back: gl.BACK,
  none: gl.NONE,
}

const mapFromWebGL = {
  [gl.FRONT]: 'front' satisfies CullMode,
  [gl.BACK]: 'back' satisfies CullMode,
  [gl.NONE]: 'none' satisfies CullMode,
}

export function cullModeToWebGL(mode: CullMode): number {
  return mapToWebGL[mode]
}

export function cullModeFromWebGL(mode: number): CullMode {
  return mapFromWebGL[mode]
}
