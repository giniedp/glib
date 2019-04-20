import { ShaderProgramOptions } from '@gglib/graphics'
import * as blocks from '../blocks'
import { buildProgram } from '../builder'

export interface DefaultProgramDefs extends
  blocks.FogDefs,
  blocks.GammaDefs,
  blocks.LightDefs,
  blocks.MtlAlphaDefs,
  blocks.MtlDiffuseDefs,
  blocks.MtlEmissionDefs,
  blocks.MtlMetallicRoughness,
  blocks.MtlNormalDefs,
  blocks.MtlOcclusionDefs,
  blocks.MtlSpecularDefs,
  blocks.MtlSplattingDefs,
  blocks.ShadeDefs,
  blocks.VBillboardDefs,
  blocks.VColorDefs,
  blocks.VNormalDefs,
  blocks.VSkinningDefs,
  blocks.VTextureDefs {
}

export function defaultProgram(defs: DefaultProgramDefs): ShaderProgramOptions {
  return buildProgram(blocks.BASE, Object.keys(blocks).sort().map((k) => blocks[k]), defs)
}
