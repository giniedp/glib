import { inputSlotScalar, inputSlotTexture, inputSlotVec3, inputSlotVec4, type ShaderModuleOptions } from '../resources'
import { BASIC_EFFECT_GLSL_FS, BASIC_EFFECT_GLSL_VS } from './BasicEffect.glsl'
import { BASIC_EFFECT_WGSL } from './BasicEffect.wgsl'

import type { EffectOptions } from './Effect'
import { CommonBlocks, CommonInputs } from './types'

export function basicEffectShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Basic Effect Shader',
    wgsl: BASIC_EFFECT_WGSL,
    glsl: {
      vertex: BASIC_EFFECT_GLSL_VS,
      fragment: BASIC_EFFECT_GLSL_FS,
    },
  }
}

export function basicEffectOptions(): EffectOptions {
  return {
    name: 'Basic Effect',
    meta: {},
    program: {
      shader: basicEffectShaderOptions(),
      sharedBlocks: [CommonBlocks.Global, CommonBlocks.View, CommonBlocks.Frame],
      perInstanceDataBlock: null,
      perInstanceTransformBlock: null,
    },
  }
}

export const BasicMaterialSchema = {
  World: CommonInputs.Object.ModelMatrix,
  View: CommonInputs.View.ViewMatrix,
  Projection: CommonInputs.View.ProjectionMatrix,
  CameraPosition: CommonInputs.View.CameraPosition,

  FogColor: CommonInputs.Global.FogColor,
  FogNear: CommonInputs.Global.FogNear,
  FogFar: CommonInputs.Global.FogFar,

  BaseColor: inputSlotVec3('material', 'baseColor'),
  EmissiveColor: inputSlotVec3('material', 'emissiveColor'),
  SpecularColor: inputSlotVec3('material', 'specularColor'),
  Roughness: inputSlotScalar('material', 'roughness'),
  Alpha: inputSlotScalar('material', 'alpha'),
  AlphaClip: inputSlotScalar('material', 'alphaClip'),

  Texture: inputSlotTexture('material', 'baseColorMap'),
  TextureEnabled: inputSlotScalar('material', 'textureEnabled'),
  TextureScaleOffset: inputSlotVec4('material', 'textureScaleOffset'),

  LightingEnabled: inputSlotScalar('material', 'lightingEnabled'),
} as const
