import { Material, MaterialOptions } from '@gglib/graphics'

import { MTL, MtlData, MtlTextureData } from '../../formats/mtl'
import { PipelineContext } from '../../PipelineContext'
import { loader, resolveUri } from '../../utils'

/**
 * @public
 */
export const loadMtlToMaterialOptions = loader<null, MaterialOptions>({
  input: ['.mtl', 'application/x-mtl'],
  output: Material.Options,
  handle: async (_, context) => {
    return (await context.manager.load(context.source, Material.OptionsArray))[0]
  },
})

/**
 * @public
 */
export const loadMtlToMaterialOptionsArray = loader<null, MaterialOptions[]>({
  input: ['.mtl', 'application/x-mtl'],
  output: Material.OptionsArray,
  handle: async (_, context) => {
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
        const offsetScale = [0, 0, 1, 1]
        if (options.o) {
          offsetScale[0] = options.o[0] || 0
          offsetScale[1] = options.o[1] || 0
        }
        if (options.s) {
          offsetScale[2] = options.s[0]
          offsetScale[3] = options.s[1]
        }
        if (options.o || options.s) {
          params[name + 'OffsetScale'] = offsetScale
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
