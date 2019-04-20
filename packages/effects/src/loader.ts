import { loader } from '@gglib/content'
import { Material, MaterialOptions, ShaderEffect, ShaderEffectOptions, ShaderProgramOptions } from '@gglib/graphics'
import { defaultProgram, DefaultProgramDefs } from './fx'

const paramDefineMap = {
  Alpha: 'ALPHA',
  AlphaClip: 'ALPHA_CLIP',

  AmbientColor: 'AMBIENT_COLOR',
  AmbientMap: 'AMBIENT_MAP',
  AmbientMapOffsetScale: 'AMBIENT_MAP_OFFSET_SCALE',

  DiffuseColor: 'DIFFUSE_COLOR',
  DiffuseMap: 'DIFFUSE_MAP',
  DiffuseMapOffsetScale: 'DIFFUSE_MAP_OFFSET_SCALE',

  SpecularColor: 'SPECULAR_COLOR',
  SpecularMap: 'SPECULAR_MAP',
  SpecularMapOffsetScale: 'SPECULAR_MAP_OFFSET_SCALE',

  EmissionColor: 'EMISSION_COLOR',
  EmissionMap: 'EMISSION_MAP',
  EmissionMapOffsetScale: 'EMISSION_MAP_OFFSET_SCALE',

  MetallicRoughnessMap: 'METALLIC_ROUGHNESS_MAP',
  MetallicRoughnessMapOffsetScale: 'METALLIC_ROUGHNESS_MAP_OFFSET_SCALE',

  OcclusionMap: 'OCCLUSION_MAP',
  OcclusionMapOffsetScale: 'OCCLUSION_MAP_OFFSET_SCALE',

  NormalMap: 'NORMAL_MAP',
  NormalMapOffsetScale: 'NORMAL_MAP_OFFSET_SCALE',

  TextureOffsetScale: 'TEXTURE1_OFFSET_SCALE',
  Texture2OffsetScale: 'TEXTURE2_OFFSET_SCALE',
}

export const materialOptionsToShaderEffectOptions = loader<MaterialOptions, ShaderEffectOptions>({
  input: Material.Options,
  output: ShaderEffect.Options,
  handle: async (input, _) => {

    if (!input) {
      return null
    }
    if (typeof input.effect !== 'string') {
      return null
    }

    const effect = input.effect
    const params = input.parameters || {}

    const defines: DefaultProgramDefs = {}
    if (params.AlphaClip != null) {
      defines.ALPHA_CLIP = true
    }
    if (params.DiffuseColor) {
      defines.DIFFUSE_COLOR = true
    }
    if (params.DiffuseMap) {
      defines.DIFFUSE_MAP = true
    }
    if (params.DiffuseMapOffsetScale) {
      defines.DIFFUSE_MAP_OFFSET_SCALE = true
    }

    if (params.SpecularMap) {
      defines.SPECULAR_MAP = true
    }
    if (params.SpecularColor) {
      defines.SPECULAR_COLOR = true
    }

    if (params.EmissionMap) {
      defines.EMISSION_MAP = true
    }
    if (params.EmissionColor) {
      defines.EMISSION_COLOR = true
    }

    if (params.OcclusionMap) {
      defines.OCCLUSION_MAP = true
    }

    if (params.NormalMap) {
      defines.NORMAL_MAP = true
    }

    if (params.TextureOffsetScale) {
      defines.V_TEXTURE1_OFFSET_SCALE = true
    }
    if (params.Texture2OffsetScale) {
      defines.V_TEXTURE2_OFFSET_SCALE = true
    }

    let options: ShaderProgramOptions
    if (effect === 'default') {
      options = defaultProgram({
        ...defines,
        LIGHT: true,
        V_NORMAL: true,
        SHADE_FUNCTION: 'shadeOptimized',
      })
    }
    if (effect === 'pbr') {
      if (params.MetallicRoughness) {
        defines.METALLIC_ROUGHNESS = true
      }
      if (params.MetallicRoughnessMap) {
        defines.METALLIC_ROUGHNESS_MAP = true
      }

      options = defaultProgram({
        ...defines,
        LIGHT: true,
        V_NORMAL: true,
        SHADE_FUNCTION: 'shadePbr',
      })
    }
    if (effect === 'blinn') {
      options = defaultProgram({
        ...defines,
        LIGHT: true,
        V_NORMAL: true,
        SHADE_FUNCTION: 'shadeBlinn',
      })
    }
    if (effect === 'phong') {
      options = defaultProgram({
        ...defines,
        LIGHT: true,
        V_NORMAL: true,
        SHADE_FUNCTION: 'shadePhong',
      })
    }
    if (effect === 'lambert') {
      options = defaultProgram({
        ...defines,
        LIGHT: true,
        V_NORMAL: true,
        SHADE_FUNCTION: 'shadeLambert',
      })
    }
    if (effect === 'constant') {
      options = defaultProgram({
        ...defines,
        LIGHT: true,
        V_NORMAL: true,
      })
    }
    if (effect === 'unlit') {
      options = defaultProgram({
        ...defines,
        SHADE_FUNCTION: 'shadeNone',
      })
    }

    if (!options) {
      return null
    }

    return {
      techniques: [{
        passes: [{
          program: options,
        }],
      }],
    }
  },
})
