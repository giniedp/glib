import { Material, MaterialOptions, ShaderEffectOptions } from '@gglib/graphics'
import { loader, resolveUri, PipelineContext, Loader } from '@gglib/content'

import { MTL, MtlTextureData } from './format'

/**
 * @public
 */
export const loadMtlToMaterialOptions: Loader<string, MaterialOptions> = loader({
  input: ['.mtl', 'application/x-mtl'],
  output: Material.Options,
  handle: async (_, context): Promise<MaterialOptions> => {
    return (await context.manager.load(context.source, Material.OptionsArray))[0]
  },
})

/**
 * Downloads text from file, parses it using {@link MTL.parse} and converts into {@link MaterialOptions} array.
 * @public
 * @remarks
 * This loader consults the `MTL` -> `Material.Options` loader if available.
 */
export const loadMtlToMaterialOptionsArray: Loader<string, MaterialOptions[]> = loader({
  input: ['.mtl', 'application/x-mtl'],
  output: Material.OptionsArray,
  handle: async (_, context): Promise<MaterialOptions[]> => {
    const text = (await context.manager.downloadText(context.source)).content
    const list = MTL.parse(text)
    if (context.pipeline.canLoad(MTL, Material.Options)) {
      return Promise.all(list.map((mtl) => context.pipeline.run(MTL, Material.Options, mtl, context)))
    }
    return Promise.all(list.map((data) => convertMaterial(data, context)))
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

async function convertMaterial(mtl: MTL, context: PipelineContext): Promise<MaterialOptions> {
  const result: MaterialOptions<ShaderEffectOptions> = {
    name: mtl.name,
    parameters: {},
    technique: 'default',
  }
  const params = result.parameters

  Object.keys(mtl).forEach((key) => {
    // convert simple parameters
    if (key in paramMap) {
      const param = mtl[key]
      const name = paramMap[key]
      params[name] = param
      return
    }
    // convert texture parameters
    if (key in textureMap) {
      const param = mtl[key] as MtlTextureData
      const name = textureMap[key]
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
  if (mtl.d != null) {
    params.Alpha = mtl.d
    params.Blend = true
  } else {
    params.Blend = false
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

  switch(mtl.illum) {
    case "0":
      result.technique = "unlit"
      break;
    case "1":
      result.technique = "lamber"
      break;
    case "2":
      result.technique = "default"
      break;
    default:
      result.technique = "default"
      break;
  }

  mtl.illum
  return result
}
