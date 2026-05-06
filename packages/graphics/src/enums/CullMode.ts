import { GLConst as gl } from './GLConst'

export type CullMode = 'Front' | 'Back' | 'None'

const mapToWebGL: Record<CullMode, number> = {
  Front: gl.FRONT,
  Back: gl.BACK,
  None: gl.NONE,
}

const mapFromWebGL = {
  [gl.FRONT]: 'Front' as CullMode,
  [gl.BACK]: 'Back' as CullMode,
  [gl.NONE]: 'None' as CullMode,
}

const mapToWebGPU: Record<CullMode, GPUCullMode> = {
  Front: 'front',
  Back: 'back',
  None: 'none',
}

export function cullModeToWebGL(mode: CullMode): number {
  return mapToWebGL[mode]
}

export function cullModeFromWebGL(mode: number): CullMode {
  return mapFromWebGL[mode]
}

export function cullModeToWebGPU(mode: CullMode): GPUCullMode {
  return mapToWebGPU[mode]
}
