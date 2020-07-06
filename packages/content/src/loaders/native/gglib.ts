import { PipelineContext } from '@gglib/content'
import { Material, MaterialOptions, Model, ModelOptions, ShaderEffect, ShaderEffectOptions, Texture, TextureOptions } from '@gglib/graphics'
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
export const loadModelOptionsToModel = loader<ModelOptions, Model>({
  input: Model.Options,
  output: Model,
  handle: async (input, context) => {
    // handle materials
    const materials = await Promise.all(input.materials.map((it) => {

      if (it instanceof Material) {
        return it
      }

      if (typeof it === 'object') {
        return context.pipeline.run(Material.Options, Material, it, context)
      }

      if (typeof it === 'string') {
        const uri = resolveUri(it, context)
        if (context.manager.canLoad(uri, Material)) {
          return context.manager.load(uri, Material)
        } else {
          return Promise.reject(`can not load model material '${typeof it}' can not be loaded as a model material`)
        }
      }

      return Promise.reject(`type '${typeof it}' can not be loaded as a model material`)
    }))

    // handle bounding boxes
    if (input.meshes.length && !BoundingBox.convert(input.boundingBox)) {
      const box = input.meshes
        .map((it) => BoundingBox.convert(it.boundingBox))
        .filter((it) => it != null)
        .reduce((a, b) => BoundingBox.merge(a || b, b), null) || new BoundingBox()
      const sphere = BoundingSphere.createFromBox(box)

      input.boundingBox = box.toArray()
      input.boundingSphere = sphere.toArray()
    }

    return context.manager.device.createModel({
      ...input,
      materials: materials,
    })
  },
})

/**
 * @public
 */
export const loadMaterialOptionsToMaterial = loader<MaterialOptions, Material>({
  input: Material.Options,
  output: Material,
  handle: async (input, context) => {
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
export const loadMaterialOptionsToMaterialArray = loader<MaterialOptions[], Material[]>({
  input: Material.OptionsArray,
  output: Material.Array,
  handle: async (input, context) => {
    return Promise.all(input.map((options) => context.pipeline.run(Material.Options, Material, options, context)))
  },
})

/**
 * @public
 */
export const loadShaderEffectOptionsToShaderEffect = loader<ShaderEffectOptions, ShaderEffect>({
  input: ShaderEffect.Options,
  output: ShaderEffect,
  handle: async (input, context) => {
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
export const loadShaderEffectOptionsToShaderEffectArray = loader<ShaderEffectOptions[], ShaderEffect[]>({
  input: ShaderEffect.OptionsArray,
  output: ShaderEffect.Array,
  handle: (input, context) => {
    return Promise.all(input.map((options) => context.pipeline.run(ShaderEffect.Options, ShaderEffect, options, context)))
  },
})

/**
 * @public
 */
export const loadJpegToTextureOptions = loader<null, TextureOptions>({
  input: ['.jpg', '.jpeg', 'image/jpg'],
  output: Texture.Options,
  handle: async (_, context) => {
    return { data: context.source }
  },
})

/**
 * @public
 */
export const loadPngToTextureOptions = loader<null, TextureOptions>({
  input: ['.png', 'image/png'],
  output: Texture.Options,
  handle: async (_, context) => {
    return { data: context.source }
  },
})

/**
 * @public
 */
export const loadImageDataToTextureOptions = loader<ImageData, TextureOptions>({
  input: ImageData,
  output: Texture.Options,
  handle: async (input, _) => {
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
export const loadTextureOptionsToTexture = loader<TextureOptions, Texture>({
  input: Texture.Options,
  output: Texture.Texture2D,
  handle: async (input, context) => {
    return context.manager.device.createTexture(input)
  },
})

/**
 * @public
 */
export const loadTextureToMaterialOptions = loader<Texture, MaterialOptions>({
  input: Texture.Texture2D,
  output: Material.Options,
  handle: (input, _) => {
    return Promise.resolve({
      name: 'Default',
      effect: 'default',
      parameters: {
        DiffuseMap: input,
      },
    })
  },
})
