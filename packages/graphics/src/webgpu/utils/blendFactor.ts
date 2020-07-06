import { getOption } from '@gglib/utils'
import { Blend } from '../../enums'

const lookup: { [k: number]: GPUBlendFactor } = {
  [Blend.Zero]: 'zero',
  [Blend.One]: 'one',
  [Blend.SrcColor]: 'src-color',
  [Blend.SrcColorInv]: 'one-minus-src-color',
  [Blend.SrcAlpha]: 'src-alpha',
  [Blend.SrcAlphaInv]: 'one-minus-src-alpha',
  [Blend.SrcAlphaSat]: 'src-alpha-saturated',
  [Blend.DstColor]: 'dst-color',
  [Blend.DstColorInv]: 'one-minus-dst-color',
  [Blend.DstAlpha]: 'dst-alpha',
  [Blend.DstAlphaInv]: 'one-minus-dst-alpha',
  [Blend.ConstantColor]: 'blend-color',
  [Blend.ConstantColorInv]: 'one-minus-blend-color',
  // [Blend.ConstantAlpha]:
  // [Blend.ConstantAlphaInv]:
}

export function toBlendFactor(v: Blend): GPUBlendFactor {
  return getOption(lookup, v, null)
}
