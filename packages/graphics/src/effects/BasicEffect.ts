import { Mat4, Vec3, Vec4 } from '@gglib/math'
import type { ShaderModuleOptions, Texture } from '../resources'
import { BASIC_EFFECT_GLSL_FS, BASIC_EFFECT_GLSL_VS } from './BasicEffect.glsl'
import { BASIC_EFFECT_WGSL } from './BasicEffect.wgsl'

import type { EffectOptions } from './Effect'
import { materialSchema } from './MaterialSchema'
import { CommonBindingKeys, IndexedInputs } from './types'

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
      shared: [],
      shader: basicEffectShaderOptions(),
    },
  }
}

export type BasicEffectInputs = {
  [CommonBindingKeys.Object.ModelMatrix]: Mat4
  [CommonBindingKeys.View.ViewMatrix]: Mat4
  [CommonBindingKeys.View.ProjectionMatrix]: Mat4
  [CommonBindingKeys.View.CameraPosition]: Vec3
  baseColorMap: Texture
  'material.baseColor': Vec3
  'material.emissiveColor': Vec3
  'material.specularColor': Vec3
  'material.roughness': number
  'material.alpha': number
  'material.alphaClip': number
  'material.textureScaleOffset': Vec4
  'fog.color': Vec3
  'fog.start': number
  'fog.end': number
  'settings.textureEnabled': number
  'settings.lightingEnabled': number
  'settings.fogEnabled': number
} & IndexedInputs<
  {
    'lights.color': Vec4
    'lights.position': Vec4
    'lights.direction': Vec4
  },
  0 | 1 | 2 | 3
>

export function basicEffectInputs(): BasicEffectInputs {
  return {
    [CommonBindingKeys.Object.ModelMatrix]: Mat4.createIdentity(),
    [CommonBindingKeys.View.ViewMatrix]: Mat4.createIdentity(),
    [CommonBindingKeys.View.ProjectionMatrix]: Mat4.createIdentity(),
    [CommonBindingKeys.View.CameraPosition]: Vec3.create(),
    baseColorMap: null,

    'material.baseColor': Vec3.create(1, 1, 1),
    'material.emissiveColor': Vec3.create(),
    'material.specularColor': Vec3.create(),
    'material.roughness': 0.5,
    'material.alpha': 1,
    'material.alphaClip': 0,
    'material.textureScaleOffset': Vec4.create(1, 1, 0, 0),

    'settings.textureEnabled': 0,
    'settings.lightingEnabled': 0,
    'settings.fogEnabled': 0,

    'lights.color[0]': Vec4.create(),
    'lights.position[0]': Vec4.create(),
    'lights.direction[0]': Vec4.create(),
    'lights.color[1]': Vec4.create(),
    'lights.position[1]': Vec4.create(),
    'lights.direction[1]': Vec4.create(),
    'lights.color[2]': Vec4.create(),
    'lights.position[2]': Vec4.create(),
    'lights.direction[2]': Vec4.create(),
    'lights.color[3]': Vec4.create(),
    'lights.position[3]': Vec4.create(),
    'lights.direction[3]': Vec4.create(),

    'fog.color': Vec3.create(0.5, 0.5, 0.5),
    'fog.start': 0,
    'fog.end': 100,
  }
}

export const BasicMaterialSchema = materialSchema<BasicEffectInputs>()({
  World: CommonBindingKeys.Object.ModelMatrix,
  View: CommonBindingKeys.View.ViewMatrix,
  Projection: CommonBindingKeys.View.ProjectionMatrix,
  CameraPosition: CommonBindingKeys.View.CameraPosition,

  BaseColor: 'material.baseColor',
  EmissiveColor: 'material.emissiveColor',
  SpecularColor: 'material.specularColor',
  Roughness: 'material.roughness',
  Alpha: 'material.alpha',
  AlphaClip: 'material.alphaClip',

  TextureScaleOffset: 'material.textureScaleOffset',
  Texture: 'baseColorMap',

  FogColor: 'fog.color',
  FogStart: 'fog.start',
  FogEnd: 'fog.end',

  FogEnabled: 'settings.fogEnabled',
  LightingEnabled: 'settings.lightingEnabled',
  TextureEnabled: 'settings.textureEnabled',
})
