import { CullMode } from '../../enums'

const lookup: { [k: number]: GPUCullMode } = {
  [CullMode.Back]: 'back',
  [CullMode.Front]: 'front',
  [CullMode.FrontAndBack]: 'none',
}

export function toCullMode(v: CullMode): GPUCullMode {
  return lookup[v] ?? null
}
