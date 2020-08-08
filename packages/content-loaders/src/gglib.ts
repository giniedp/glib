import {
  Material,
  MaterialOptions,
  Model,
  ModelOptions,
  ShaderEffect,
  ShaderEffectOptions,
  Texture,
  TextureOptions,
  ModelMesh,
  ShaderFxDocument,
  createShaderEffectOptions,
} from '@gglib/graphics'
import { BoundingBox, BoundingSphere } from '@gglib/math'
import { loader, resolveUri, PipelineContext } from '@gglib/content'
import { YML } from './yml'

/**
 * Downloads `.ggmod` textfile and interprets the content as `ModelOptions` json
 * @public
 */
export const loadGgmodToModelOptions = loader({
  input: '.ggmod',
  output: Model.Options,
  handle: async (_, context): Promise<ModelOptions> => {
    const text = (await context.manager.downloadText(context.source)).content
    return JSON.parse(text)
  },
})

/**
 * Downloads `.ggmat` textfile and interprets the content as `MaterialOptions` json object
 *
 * @public
 * @remarks
 * If the file contains a json array, only the first entry is resolved
 */
export const loadGgmatToMaterialOptions = loader({
  input: '.ggmat',
  output: Material.Options,
  handle: async (_, context): Promise<MaterialOptions> => {
    return (await context.manager.load(context.source, Material.OptionsArray))[0]
  },
})

/**
 * Downloads `.ggmat` textfile and interprets the content as `MaterialOptions[]` json array
 * @public
 * @remarks
 * If the file contains a json object, it is pushed into a new array and returned
 */
export const loadGgmatToMaterialOptionsArray = loader({
  input: '.ggmat',
  output: Material.OptionsArray,
  handle: async (_, context): Promise<MaterialOptions[]> => {
    const text = (await context.manager.download(context.source)).content
    const result = JSON.parse(text)
    return Array.isArray(result) ? result : [result]
  },
})

/**
 * Downloads `.ggfx` textfile and interprets the content as `ShaderEffectOptions` yaml
 * @public
 */
export const loadGgfxToShaderEffectOptions = loader({
  input: ['.ggfx', 'application/x-yaml'],
  output: ShaderEffect.Options,
  handle: async (_, context): Promise<ShaderEffectOptions> => {
    const data = await context.manager.downloadText(context.source)
    const includeHandler = (includePath: string) => {
      const url = resolveUri(includePath, context)
      const cache = context.options.includeCache || {}
      context.options.includeCache = cache
      return (cache[url] = cache[url] || context.manager.download(url).then((res) => res.content))
    }
    const doc = YML.parse(data.content) as ShaderFxDocument
    return createShaderEffectOptions(doc, includeHandler)
  },
})

/**
 * Instantiates a `Model` from `ModelOptions`
 *
 * @public
 * @remarks
 * Materials are resolved as follows
 * - instance of `Material` is kept as is
 * - type of `object` is assumed to be a `MaterialOptions` object. `Material.Options` to `Material` loader is consulted
 * - type of `string` is assumed to be a URI referencing a material file relative to given context.
 * - Everything else is an error
 *
 * If the models bounding box is missing or is of zero size then the box is created by
 * merging all bounding boxes of all meshes
 */
export const loadModelOptionsToModel = loader({
  input: Model.Options,
  output: Model,
  handle: async (modelOptions: ModelOptions, context): Promise<Model> => {
    const meshes: ModelMesh[] = []

    for (const meshOptions of modelOptions.meshes) {
      if (meshOptions instanceof ModelMesh) {
        meshes.push(meshOptions)
        continue
      }

      const materials: Promise<Material>[] = []
      for (const mtlOptions of meshOptions.materials) {
        if (mtlOptions instanceof Material) {
          materials.push(Promise.resolve(mtlOptions))
          continue
        }
        if (typeof mtlOptions === 'object') {
          materials.push(context.pipeline.run(Material.Options, Material, mtlOptions, context))
          continue
        }
        if (typeof mtlOptions === 'string') {
          const uri = resolveUri(mtlOptions, context)
          if (context.manager.canLoad(uri, Material)) {
            materials.push(context.manager.load(uri, Material))
            continue
          }
        }
        materials.push(Promise.reject(`type '${typeof mtlOptions}' can not be loaded as a model material`))
      }

      // handle bounding boxes
      if (meshOptions.parts.length && !BoundingBox.convert(meshOptions.boundingBox)) {
        const box =
          meshOptions.parts
            .map((it) => BoundingBox.convert(it.boundingBox))
            .filter((it) => it != null)
            .reduce((a, b) => BoundingBox.merge(a || b, b), null) || new BoundingBox()
        const sphere = BoundingSphere.createFromBox(box)

        meshOptions.boundingBox = box.toArray()
        meshOptions.boundingSphere = sphere.toArray()
      }

      meshes.push(
        new ModelMesh(context.manager.device, {
          ...meshOptions,
          materials: await Promise.all(materials),
        }),
      )
    }

    return context.manager.device.createModel({
      ...modelOptions,
      meshes: meshes,
    })
  },
})

/**
 * Instantiates a `Material` from `MaterialOptions`
 *
 * @public
 * @remarks
 * Effects are resolved as follows
 * - if `effectUri` is set, pipeline for `Material.OptionsUri` -> `Material.Options` is run
 * - if `technique` is set, pipeline for `Material.OptionsTechnique` -> `Material.Options` is run
 * - if `effect` is type of `object`, pipeline for `ShaderEffect.Options` -> `ShaderEffect` is run
 * - if `effect` is instance of `ShaderEffect`, it is kept as is
 * - It is an error, if in the end no instance of `ShaderEffect` could be resolved
 *
 * The parameters are processed in a way, that values having type of `string` are interpreted
 * as texture URIs
 */
export const loadMaterialOptionsToMaterial = loader({
  input: Material.Options,
  output: Material,
  handle: async (input: MaterialOptions, context): Promise<Material> => {

    if (!input.effect && input.effectUri) {
      if (context.pipeline.canLoad(Material.OptionsUri, Material.Options)) {
        input = (await context.pipeline.run(Material.OptionsUri, Material.Options, input, context)) || input
      }
    }
    if (!input.effect && input.technique) {
      if (context.pipeline.canLoad(Material.OptionsTechnique, Material.Options)) {
        input = (await context.pipeline.run(Material.OptionsTechnique, Material.Options, input, context)) || input
      }
    }

    if (input.effect instanceof ShaderEffect) {
      // OK
    } else if (typeof input.effect === 'object') {
      input.effect = await context.pipeline.run(ShaderEffect.Options, ShaderEffect, input.effect, context)
    }

    if (!(input.effect instanceof ShaderEffect)) {
      return Promise.reject(`can not load effect from ${input.effect}`)
    }

    await loadStringKeysAsTexture(input.parameters, context)

    return new Material(context.manager.device, input)
  },
})

/**
 * Processes material options which have the `effectUri` property set
 *
 * @public
 */
export const loadMaterialOptionsUriToMaterialOptions = loader({
  input: Material.OptionsUri,
  output: Material.Options,
  handle: async (input: MaterialOptions, context): Promise<MaterialOptions> => {
    const uri = resolveUri(input.effectUri, context)
    if (!context.manager.canLoad(uri, ShaderEffect.Options)) {
      return null
    }
    return {
      ...input,
      effect: await context.manager.load(uri, ShaderEffect.Options),
      parameters: {
        ...(input.parameters || {})
      }
    }
  },
})

/**
 * @public
 */
export const loadMaterialOptionsToMaterialArray = loader({
  input: Material.OptionsArray,
  output: Material.Array,
  handle: async (input: MaterialOptions[], context): Promise<Material[]> => {
    return Promise.all(input.map((options) => context.pipeline.run(Material.Options, Material, options, context)))
  },
})

/**
 * @public
 */
export const loadShaderEffectOptionsToShaderEffect = loader({
  input: ShaderEffect.Options,
  output: ShaderEffect,
  handle: async (input: ShaderEffectOptions, context): Promise<ShaderEffect> => {
    await loadStringKeysAsTexture(input.parameters, context)
    return new ShaderEffect(context.manager.device, input)
  },
})

async function loadStringKeysAsTexture(input: any, context: PipelineContext) {
  if (typeof input === 'object') {
    for (const name of Object.keys(input)) {
      const value = input[name]
      if (typeof value !== 'string') {
        continue
      }
      const uri = resolveUri(value, context)
      if (context.manager.canLoad(uri, Texture.Texture2D)) {
        input[name] = await context.manager.load(uri, Texture.Texture2D)
      } else {
        //
      }
    }
  }
  return input
}

/**
 * @public
 */
export const loadShaderEffectOptionsToShaderEffectArray = loader({
  input: ShaderEffect.OptionsArray,
  output: ShaderEffect.Array,
  handle: (input: ShaderEffectOptions[], context): Promise<ShaderEffect[]> => {
    return Promise.all(
      input.map((options) => {
        return context.pipeline.run(ShaderEffect.Options, ShaderEffect, options, context)
      }),
    )
  },
})

/**
 * @public
 */
export const loadJpegToTextureOptions = loader({
  input: ['.jpg', '.jpeg', 'image/jpg'],
  output: Texture.Options,
  handle: async (_, context): Promise<TextureOptions> => {
    return { data: context.source }
  },
})

/**
 * @public
 */
export const loadPngToTextureOptions = loader({
  input: ['.png', 'image/png'],
  output: Texture.Options,
  handle: async (_, context): Promise<TextureOptions> => {
    return { data: context.source }
  },
})

/**
 * @public
 */
export const loadImageDataToTextureOptions = loader({
  input: ImageData,
  output: Texture.Options,
  handle: async (input: ImageData, _): Promise<TextureOptions> => {
    return {
      data: input.data,
      width: input.width,
      height: input.height,
    }
  },
})

/**
 * @public
 */
export const loadTextureOptionsToTexture = loader({
  input: Texture.Options,
  output: Texture.Texture2D,
  handle: async (input: TextureOptions, context): Promise<Texture> => {
    return context.manager.device.createTexture(input)
  },
})

/**
 * @public
 */
export const loadTextureToMaterialOptions = loader({
  input: Texture.Texture2D,
  output: Material.Options,
  handle: (input: Texture, _): Promise<MaterialOptions> => {
    return Promise.resolve({
      name: 'Default',
      technique: 'default',
      parameters: {
        DiffuseMap: input,
      },
    })
  },
})
