import { assembleProgram, ShaderProgramOptions } from '@gglib/graphics'

import {
  FogDefs,
  GammaDefs,
  LightDefs,
  MtlAlphaDefs,
  MtlAmbientDefs,
  MtlBaseDefs,
  MtlEmissionDefs,
  MtlEnvironmentDefs,
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
  DEBUG,
  GAMMA,
  GL300ES,
  MTL_ALPHA,
  MTL_AMBIENT,
  MTL_BASE,
  MTL_EMISSION,
  MTL_ENVIRONMENT,
  MTL_INDEX_OF_REFRACTION,
  MTL_METALLIC_ROUGHNESS,
  MTL_NORMAL,
  MTL_OCCLUSION,
  MTL_PARALLAX,
  MTL_SPECULAR,
  MTL_SPLATTING,
  MTL_TRANSMISSION,
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

export const MATERIAL_CHUNKS = {
  GL300ES,
  BASE,
  COMMON,
  DEBUG,
  GAMMA,
  MTL_ALPHA,
  MTL_AMBIENT,
  MTL_BASE,
  MTL_EMISSION,
  MTL_ENVIRONMENT,
  MTL_INDEX_OF_REFRACTION,
  MTL_METALLIC_ROUGHNESS,
  MTL_NORMAL,
  MTL_OCCLUSION,
  MTL_PARALLAX,
  MTL_SPECULAR,
  MTL_SPLATTING,
  MTL_TRANSMISSION,
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
export type MaterialProgramDefs = FogDefs &
  GammaDefs &
  LightDefs &
  MtlAlphaDefs &
  MtlAmbientDefs &
  MtlBaseDefs &
  MtlEmissionDefs &
  MtlMetallicRoughness &
  MtlNormalDefs &
  MtlParallaxDefs &
  MtlOcclusionDefs &
  MtlSpecularDefs &
  MtlSplattingDefs &
  MtlEnvironmentDefs &
  ShadeDefs &
  VBillboardDefs &
  VColorDefs &
  VNormalDefs &
  VSkinningDefs &
  VTextureDefs

/**
 * Assembles the vertex and fragment shader source code for a material program.
 *
 * @public
 */
export function materialProgram(defines: MaterialProgramDefs): ShaderProgramOptions {
  const chunks = Object.values(MATERIAL_CHUNKS).filter((it) => typeof it === 'object')
  return assembleProgram({
    template: MATERIAL_CHUNKS.BASE,
    chunks,
    defines,
  })
}
