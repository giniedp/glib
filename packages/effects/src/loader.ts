import { loader } from '@gglib/content'
import { Material, MaterialOptions, ShaderProgramOptions, CullState, BlendState, IBlendState, ICullState } from '@gglib/graphics'
import { defaultProgram, DefaultProgramDefs } from './programs'

/**
 * @public
 */
export const loadMaterialOptionsToShaderEffectOptions = loader({
  input: Material.OptionsTechnique,
  output: Material.Options,
  handle: async (input: MaterialOptions, _): Promise<MaterialOptions> => {

    if (!input?.technique) {
      return null
    }

    const technique = input.technique
    const params = input.parameters || {}
    const defines: DefaultProgramDefs = {}

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

    defineMap('AMBIENT_MAP')
    defineMap('DIFFUSE_MAP')
    defineMap('SPECULAR_MAP')
    defineMap('EMISSION_MAP')
    defineMap('OCCLUSION_MAP')
    defineMap('NORMAL_MAP')

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
    if (params.VertexColor) {
      defines.V_COLOR = true
    }
    if (params.VertexColo1) {
      defines.V_COLOR1 = true
    }
    if (params.VertexColo2) {
      defines.V_COLOR2 = true
    }

    if (params.TextureScaleOffset) {
      defines.V_TEXTURE_SCALE_OFFSET = params.TextureScaleOffset != null
    }
    if (params.Texture1ScaleOffset) {
      defines.V_TEXTURE1_SCALE_OFFSET = params.Texture1ScaleOffset != null
    }
    if (params.Texture2ScaleOffset) {
      defines.V_TEXTURE2_SCALE_OFFSET = params.Texture2ScaleOffset != null
    }

    if (params.AlphaClip != null) {
      defines.ALPHA_CLIP = true
    }
    if (typeof params.JointCount === 'number') {
      defines.SKINNING_JOINT_COUNT = params.JointCount
    }
    if (typeof params.WeightCount === 'number') {
      defines.SKINNING_WEIGHT_COUNT = params.WeightCount
    }

    defines.LIGHT = true
    defines.V_NORMAL = true

    if (technique === 'default') {
      defines.SHADE_FUNCTION = 'shadeOptimized'
    } else if (technique === 'pbr') {
      if (params.MetallicRoughness) {
        defines.METALLIC_ROUGHNESS = true
      }
      if (params.MetallicRoughnessMap) {
        defines.METALLIC_ROUGHNESS_MAP = true
      }
      defines.SHADE_FUNCTION = 'shadePbr'
    } else if (technique === 'blinn') {
      defines.SHADE_FUNCTION = 'shadeBlinn'
    } else if (technique === 'phong') {
      defines.SHADE_FUNCTION = 'shadePhong'
    } else if (technique === 'lambert') {
      defines.SHADE_FUNCTION = 'shadeLambert'
    } else if (technique === 'constant') {
      // OK
    } else if (technique === 'unlit') {
      defines.SHADE_FUNCTION = 'shadeNone'
      delete defines.LIGHT
      delete defines.V_NORMAL
    } else {
      return null
    }

    let blendState: IBlendState = {
      ...BlendState.AlphaBlend
    }
    let cullState: ICullState

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

    return {
      ...input,
      effect: {
        techniques: [{
          passes: [{
            program: defaultProgram(defines),
            blendState: blendState,
            cullState: cullState,
          }],
        }],
      }
    }
  },
})
