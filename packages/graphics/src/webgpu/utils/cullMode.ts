import { CullMode } from '../../enums'

const lookup: Record<CullMode, GPUCullMode> = {
  Back: 'back',
  Front: 'front',
  None: 'none',
}

export function toCullMode(v: CullMode): GPUCullMode {
  return lookup[v] ?? null
}
