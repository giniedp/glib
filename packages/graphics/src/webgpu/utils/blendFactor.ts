import { Blend } from '../../enums'

const lookup: Record<Blend, GPUBlendFactor> = {
  Zero: 'zero',
  One: 'one',
  SrcColor: 'src-color',
  OneMinusSrcColor: 'one-minus-src-color',
  SrcAlpha: 'src-alpha',
  OneMinusSrcAlpha: 'one-minus-src-alpha',
  SrcAlphaSaturated: 'src-alpha-saturated',
  DstColor: 'dst-color',
  OneMinusDstColor: 'one-minus-dst-color',
  DstAlpha: 'dst-alpha',
  OneMinusDstAlpha: 'one-minus-dst-alpha',
  BlendColor: 'blend-color',
  OneMinusBlendColor: 'one-minus-blend-color',
  BlendAlpha: null,
}

export function toBlendFactor(v: Blend): GPUBlendFactor {
  return lookup[v] ?? null
}
