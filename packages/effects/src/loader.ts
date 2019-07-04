import { loader } from '@gglib/content'
import { Material, MaterialOptions, ShaderEffect, ShaderEffectOptions, ShaderProgramOptions } from '@gglib/graphics'
import { defaultProgram, DefaultProgramDefs } from './programs'

/**
 * @public
 */
export const loadMaterialOptionsToShaderEffectOptions = loader<MaterialOptions, ShaderEffectOptions>({
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

    if (params.AmbientColor != null) {
      defines.AMBIENT_COLOR = true
    }
    if (params.AmbientMap) {
      defines.AMBIENT_MAP = true
    }
    if (params.AmbientMapScaleOffset) {
      defines.AMBIENT_MAP_SCALE_OFFSET = params.AmbientMapScaleOffset != null
    }

    if (params.DiffuseColor) {
      defines.DIFFUSE_COLOR = true
    }
    if (params.DiffuseMap) {
      defines.DIFFUSE_MAP = true
    }
    if (params.DiffuseMapScaleOffset) {
      defines.DIFFUSE_MAP_SCALE_OFFSET = params.DiffuseMapScaleOffset != null
    }

    if (params.SpecularColor) {
      defines.SPECULAR_COLOR = true
    }
    if (params.SpecularMap) {
      defines.SPECULAR_MAP = true
    }
    if (params.SpecularMapScaleOffset) {
      defines.SPECULAR_MAP_SCALE_OFFSET = params.SpecularMapScaleOffset != null
    }

    if (params.EmissionColor) {
      defines.EMISSION_COLOR = true
    }
    if (params.EmissionMap) {
      defines.EMISSION_MAP = true
    }
    if (params.EmissionMapScaleOffset) {
      defines.EMISSION_MAP_SCALE_OFFSET = params.EmissionMapScaleOffset != null
    }

    if (params.OcclusionMap) {
      defines.OCCLUSION_MAP = true
    }
    if (params.OcclusionMapScaleOffset) {
      defines.OCCLUSION_MAP_SCALE_OFFSET = params.OcclusionMapScaleOffset != null
    }

    if (params.NormalMap) {
      defines.NORMAL_MAP = true
    }
    if (params.NormalMapScaleOffset) {
      defines.NORMAL_MAP_SCALE_OFFSET = params.NormalMapScaleOffset != null
    }

    if (params.TextureScaleOffset) {
      defines.V_TEXTURE1_SCALE_OFFSET = params.TextureScaleOffset != null
    }
    if (params.Texture2ScaleOffset) {
      defines.V_TEXTURE2_SCALE_OFFSET = params.Texture2ScaleOffset != null
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
