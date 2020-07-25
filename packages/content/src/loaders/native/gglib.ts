import { PipelineContext } from '@gglib/content'
import { Material, MaterialOptions, Model, ModelOptions, ShaderEffect, ShaderEffectOptions, Texture, TextureOptions, ModelMesh } from '@gglib/graphics'
import { BoundingBox, BoundingSphere } from '@gglib/math'
import { loader, resolveUri } from '../../utils'

/**
 * Loads and instantiates a Model from ModelOptions
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
        const box = meshOptions.parts
          .map((it) => BoundingBox.convert(it.boundingBox))
          .filter((it) => it != null)
          .reduce((a, b) => BoundingBox.merge(a || b, b), null) || new BoundingBox()
        const sphere = BoundingSphere.createFromBox(box)

        meshOptions.boundingBox = box.toArray()
        meshOptions.boundingSphere = sphere.toArray()
      }

      meshes.push(new ModelMesh(context.manager.device, {
        ...meshOptions,
        materials: await Promise.all(materials),
      }))
    }

    return context.manager.device.createModel({
      ...modelOptions,
      meshes: meshes
    })
  },
})

/**
 * @public
 */
export const loadMaterialOptionsToMaterial = loader({
  input: Material.Options,
  output: Material,
  handle: async (input: MaterialOptions, context): Promise<Material> => {
    const effect = input.effect
    if (typeof effect === 'string') {
      const uri = resolveUri(effect, context)
      if (context.manager.canLoad(uri, ShaderEffect.Options)) {
        input.effect = await context.manager.load(resolveUri(effect, context), ShaderEffect.Options)
      } else if (context.pipeline.canLoad(Material.Options, ShaderEffect.Options)) {
        const loaded = await context.pipeline.run(Material.Options, ShaderEffect.Options, input, context)
        if (loaded) {
          input.effect = loaded
        } else {
          // TODO: report error
        }
      } else {
        return Promise.reject(`can not load effect from '${effect}' nor from '${uri}'`)
      }
    }

    if (typeof input.effect === 'object') {
      input.effect = await context.pipeline.run(ShaderEffect.Options, ShaderEffect, input.effect, context)
    } else {
      return Promise.reject(`can not load effect from ${input.effect}`)
    }

    await loadStringKeysAsTexture(input.parameters, context)

    return new Material(context.manager.device, input)
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
    return Promise.all(input.map((options) => context.pipeline.run(ShaderEffect.Options, ShaderEffect, options, context)))
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
      effect: 'default',
      parameters: {
        DiffuseMap: input,
      },
    })
  },
})
