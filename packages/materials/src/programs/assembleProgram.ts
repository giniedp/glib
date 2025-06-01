import { assembleProgram, ShaderProgramOptions } from '@gglib/graphics'

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
  GAMMA,
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
  SCENE_FOG,
  SCENE_LIGHTS,
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

export const CHUNKS = {
  BASE,
  COMMON,
  GAMMA,
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
  SCENE_FOG,
  SCENE_LIGHTS,
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
}

/**
 * @public
 */
export interface DefaultProgramDefs
  extends FogDefs,
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
    VTextureDefs {}

/**
 * @public
 */
export function materialProgram(defs: DefaultProgramDefs): ShaderProgramOptions {
  const chunks = Object.values(CHUNKS).filter((it) => typeof it === 'object')
  return assembleProgram(CHUNKS.BASE, chunks, defs)
}
