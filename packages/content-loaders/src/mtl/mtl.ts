import { Material, MaterialOptions } from '@gglib/graphics'
import { loader, resolveUri, PipelineContext } from '@gglib/content'

import { MTL, MtlData, MtlTextureData } from './format'

/**
 * @public
 */
export const loadMtlToMaterialOptions = loader({
  input: ['.mtl', 'application/x-mtl'],
  output: Material.Options,
  handle: async (_, context): Promise<MaterialOptions> => {
    return (await context.manager.load(context.source, Material.OptionsArray))[0]
  },
})

/**
 * @public
 */
export const loadMtlToMaterialOptionsArray = loader({
  input: ['.mtl', 'application/x-mtl'],
  output: Material.OptionsArray,
  handle: async (_, context): Promise<MaterialOptions[]> => {
    const text = (await context.manager.downloadText(context.source)).content
    return Promise.all(MTL.parse(text).map((data) => convertMaterial(data, context)))
  },
})

const paramMap = {
  Ka: 'AmbientColor',
  Kd: 'DiffuseColor',
  Ks: 'SpecularColor',
}

const textureMap = {
  map_Ka: 'AmbientMap',
  map_Kd: 'DiffuseMap',
  map_Ks: 'SpecularMap',
  map_d: 'AlphaMap',
  bump: 'NormalMap',
  disp: 'DisplaceMap',
  refl: 'ReflectionMap',
}

async function convertMaterial(mtl: MtlData, context: PipelineContext): Promise<MaterialOptions> {
  const result: MaterialOptions<string> = {
    name: mtl.name,
    parameters: {},
    effect: 'default',
  }
  const params = result.parameters

  Object.keys(mtl).forEach((mtlName) => {
    // convert simple parameters
    if (mtlName in paramMap) {
      const param = mtl[mtlName]
      const name = paramMap[mtlName]
      params[name] = param
      return
    }
    // convert texture parameters
    if (mtlName in textureMap) {
      const param = mtl[mtlName] as MtlTextureData
      const name = textureMap[mtlName]
      params[name] = resolveUri(param.file, context)
      if (param.options) {
        const options = param.options
        const offsetScale = [1, 1, 0, 0]
        if (options.s) {
          offsetScale[0] = options.s[0]
          offsetScale[1] = options.s[1]
        }
        if (options.o) {
          offsetScale[2] = options.o[0] || 0
          offsetScale[3] = options.o[1] || 0
        }
        if (options.o || options.s) {
          params[name + 'ScaleOffset'] = offsetScale
        }
      }
    }
  })
  // convert other parmeters
  params.AlphaClip = 0.9
  if (mtl.d != null) {
    params.Alpha = mtl.d
  }
  if (mtl.Ni != null) {
    // params.refraction = m.Ni
  }

  if (mtl.Ns != null) {
    params.SpecularPower = mtl.Ns
    // TODO: convert to range [0:1]
    // if (result.parameters.SpecularPower > 1) {
    //   result.parameters.SpecularPower = Math.log(result.parameters.SpecularPower) / Math.log(2) / 10.5
    // }
  }

  return result
}
