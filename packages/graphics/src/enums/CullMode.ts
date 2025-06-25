import { GLConst as gl } from './GLConst'

export type CullMode = 'Front' | 'Back' | 'None'

const mapToWebGL: Record<CullMode, number> = {
  Front: gl.FRONT,
  Back: gl.BACK,
  None: gl.NONE,
}

const mapToWebGPU: Record<CullMode, GPUCullMode> = {
  Front: 'front',
  Back: 'back',
  None: 'none',
}

export function cullModeToWebGL(mode: CullMode): number {
  return mapToWebGL[mode]
}

export function cullModeToWebGPU(mode: CullMode): GPUCullMode {
  return mapToWebGPU[mode]
}
