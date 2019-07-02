// tslint:disable:no-duplicate-imports

import { ShaderProgramOptions } from '@gglib/graphics'
import { buildProgram } from '../builder'
import {
  FogDefs,
  GammaDefs,
  LightDefs,
  MtlAlphaDefs,
  MtlAmbientDefs,
  MtlDiffuseDefs,
  MtlEmissionDefs,
  MtlMetallicRoughness,
  MtlNormalDefs,
  MtlOcclusionDefs,
  MtlParallaxDefs,
  MtlSpecularDefs,
  MtlSplattingDefs,
  ShadeDefs,
  VBillboardDefs,
  VColorDefs,
  VNormalDefs,
  VSkinningDefs,
  VTextureDefs,
} from '../chunks'

import {
  BASE,
  COMMON,
  FOG,
  GAMMA,
  LIGHTS,
  MAIN,
  MTL_ALPHA,
  MTL_AMBIENT,
  MTL_DIFFUSE,
  MTL_EMISSION,
  MTL_METALLIC_ROUGHNESS,
  MTL_NORMAL,
  MTL_OCCLUSION,
  MTL_PARALLAX,
  MTL_SPECULAR,
  MTL_SPLATTING,
  SHADE,
  SHADE_BLINN,
  SHADE_COOK_TORRANCE,
  SHADE_LAMBERT,
  SHADE_OPTIMIZED,
  SHADE_PBR,
  SHADE_PHONG,
  SHADE_SZIRMAY,
  UTILS,
  V_BILLBOARD,
  V_COLOR,
  V_NORMAL,
  V_SKINNING,
  V_TEXTURE,
} from '../chunks'

const chunks = [
  COMMON,
  FOG,
  GAMMA,
  LIGHTS,
  MAIN,
  MTL_ALPHA,
  MTL_AMBIENT,
  MTL_DIFFUSE,
  MTL_EMISSION,
  MTL_METALLIC_ROUGHNESS,
  MTL_NORMAL,
  MTL_OCCLUSION,
  MTL_PARALLAX,
  MTL_SPECULAR,
  MTL_SPLATTING,
  SHADE,
  SHADE_BLINN,
  SHADE_COOK_TORRANCE,
  SHADE_LAMBERT,
  SHADE_OPTIMIZED,
  SHADE_PBR,
  SHADE_PHONG,
  SHADE_SZIRMAY,
  UTILS,
  V_BILLBOARD,
  V_COLOR,
  V_NORMAL,
  V_SKINNING,
  V_TEXTURE,
]

/**
 * @public
 */
export interface DefaultProgramDefs extends
  FogDefs,
  GammaDefs,
  LightDefs,
  MtlAlphaDefs,
  MtlAmbientDefs,
  MtlDiffuseDefs,
  MtlEmissionDefs,
  MtlMetallicRoughness,
  MtlNormalDefs,
  MtlParallaxDefs,
  MtlOcclusionDefs,
  MtlSpecularDefs,
  MtlSplattingDefs,
  ShadeDefs,
  VBillboardDefs,
  VColorDefs,
  VNormalDefs,
  VSkinningDefs,
  VTextureDefs {

}

/**
 * @public
 */
export function defaultProgram(defs: DefaultProgramDefs): ShaderProgramOptions {
  return buildProgram(BASE, chunks, defs)
}
