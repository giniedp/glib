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
  FXC_BASE,
  FXC_BASE_MAIN,
  FXC_COMMON,
  FXC_GAMMA,
  FXC_MTL_ALPHA,
  FXC_MTL_AMBIENT,
  FXC_MTL_DIFFUSE,
  FXC_MTL_EMISSION,
  FXC_MTL_METALLIC_ROUGHNESS,
  FXC_MTL_NORMAL,
  FXC_MTL_OCCLUSION,
  FXC_MTL_PARALLAX,
  FXC_MTL_SPECULAR,
  FXC_MTL_SPLATTING,
  FXC_SCENE_FOG,
  FXC_SCENE_LIGHTS,
  FXC_SHADE,
  FXC_SHADE_BLINN,
  FXC_SHADE_COOK_TORRANCE,
  FXC_SHADE_LAMBERT,
  FXC_SHADE_OPTIMIZED,
  FXC_SHADE_PBR,
  FXC_SHADE_PHONG,
  FXC_SHADE_SZIRMAY,
  FXC_UTILS,
  FXC_V_BILLBOARD,
  FXC_V_COLOR,
  FXC_V_NORMAL,
  FXC_V_SKINNING,
  FXC_V_TEXTURE,
} from '../chunks'

const chunks = [
  FXC_BASE_MAIN,
  FXC_COMMON,
  FXC_GAMMA,
  FXC_MTL_ALPHA,
  FXC_MTL_AMBIENT,
  FXC_MTL_DIFFUSE,
  FXC_MTL_EMISSION,
  FXC_MTL_METALLIC_ROUGHNESS,
  FXC_MTL_NORMAL,
  FXC_MTL_OCCLUSION,
  FXC_MTL_PARALLAX,
  FXC_MTL_SPECULAR,
  FXC_MTL_SPLATTING,
  FXC_SCENE_FOG,
  FXC_SCENE_LIGHTS,
  FXC_SHADE,
  FXC_SHADE_BLINN,
  FXC_SHADE_COOK_TORRANCE,
  FXC_SHADE_LAMBERT,
  FXC_SHADE_OPTIMIZED,
  FXC_SHADE_PBR,
  FXC_SHADE_PHONG,
  FXC_SHADE_SZIRMAY,
  FXC_UTILS,
  FXC_V_BILLBOARD,
  FXC_V_COLOR,
  FXC_V_NORMAL,
  FXC_V_SKINNING,
  FXC_V_TEXTURE,
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
  return buildProgram(FXC_BASE, chunks, defs)
}
