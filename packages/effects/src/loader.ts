import { loader } from '@gglib/content'
import { Material, MaterialOptions, ShaderEffect, ShaderEffectOptions, ShaderProgramOptions, CullState, BlendState, IBlendState, ICullState } from '@gglib/graphics'
import { defaultProgram, DefaultProgramDefs } from './programs'

/**
 * @public
 */
export const loadMaterialOptionsToShaderEffectOptions = loader({
  input: Material.Options,
  output: ShaderEffect.Options,
  handle: async (input: MaterialOptions, _): Promise<ShaderEffectOptions> => {

    if (!input) {
      return null
    }
    if (typeof input.effect !== 'string') {
      return null
    }

    const effect = input.effect
    const params = input.parameters || {}

    const defines: DefaultProgramDefs = {}

    let blendState: IBlendState = {
      ...BlendState.AlphaBlend
    }
    let cullState: ICullState

    if (params.AlphaClip != null) {
      defines.ALPHA_CLIP = true
    }
    if (typeof params.JointCount === 'number') {
      defines.SKINNING_JOINT_COUNT = params.JointCount
    }
    if (typeof params.WeightCount === 'number') {
      defines.SKINNING_WEIGHT_COUNT = params.WeightCount
    }

    function defineMap(MAP: keyof DefaultProgramDefs) {
      const MAP_SCALE_OFFSET = `${MAP}_SCALE_OFFSET`
      const MAP_UV = `${MAP}_UV`

      const prop = MAP.toLocaleLowerCase().split('_').map((it) => it[0].toLocaleUpperCase() + it.substring(1)).join('')
      const map = params[prop]
      const mapScaleOffset = params[`${prop}ScaleOffset`]
      const mapCoord = params[`${prop}Coord`]

      if (!map) {
        return
      }

      defines[MAP as any] = true

      if (mapScaleOffset) {
        defines[MAP_SCALE_OFFSET] = mapScaleOffset != null
      }
      if (mapCoord) {
        defines[MAP_UV] = `vTexture${mapCoord}.xy`
        defines[`V_TEXTURE${mapCoord}`] = true
      } else {
        defines.V_TEXTURE = true
      }
    }

    if (params.AmbientColor != null) {
      defines.AMBIENT_COLOR = true
    }
    if (params.DiffuseColor) {
      defines.DIFFUSE_COLOR = true
    }
    if (params.SpecularColor) {
      defines.SPECULAR_COLOR = true
    }
    if (params.EmissionColor) {
      defines.EMISSION_COLOR = true
    }

    defineMap('AMBIENT_MAP')
    defineMap('DIFFUSE_MAP')
    defineMap('SPECULAR_MAP')
    defineMap('EMISSION_MAP')
    defineMap('OCCLUSION_MAP')
    defineMap('NORMAL_MAP')

    if (params.TextureScaleOffset) {
      defines.V_TEXTURE_SCALE_OFFSET = params.TextureScaleOffset != null
    }
    if (params.Texture1ScaleOffset) {
      defines.V_TEXTURE1_SCALE_OFFSET = params.Texture1ScaleOffset != null
    }
    if (params.Texture2ScaleOffset) {
      defines.V_TEXTURE2_SCALE_OFFSET = params.Texture2ScaleOffset != null
    }

    if ('Blend' in params) {
      blendState = {
        ...BlendState.AlphaBlend
      }
    }
    if ('DoubleSided' in params) {
      cullState = {
        ...CullState.CullNone
      }
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

    const result: ShaderEffectOptions = {
      techniques: [{
        passes: [{
          program: options,
        }],
      }],
    }
    result.techniques[0].passes[0].blendState = blendState
    result.techniques[0].passes[0].cullState = cullState
    return result
  },
})
