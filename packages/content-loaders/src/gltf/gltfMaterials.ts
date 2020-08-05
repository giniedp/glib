import { resolveUri, PipelineContext } from '@gglib/content'
import { MaterialOptions } from '@gglib/graphics'
import { Log } from '@gglib/utils'
import {
  DocumentReader,
  TextureInfo,
  TextureTransform,
  KHR_texture_transform,
  KHR_materials_unlit,
  KHR_materials_pbrSpecularGlossiness,
  PbrMaterialSpecularGlossiness,
} from './format'

export async function loadGltfMaterial(
  context: PipelineContext,
  reader: DocumentReader,
  materialIndex: number,
): Promise<MaterialOptions> {
  const material = (reader.doc.materials || [])[materialIndex] || {}

  const params: { [k: string]: any } = {}
  let effect = 'default'

  if (material.normalTexture != null) {
    params.NormalMap = await loadTexture(context, reader, material.normalTexture.index)
    readTextureInfo(params, 'NormalMap', material.normalTexture)
  }
  if (material.occlusionTexture != null) {
    params.OcclusionMap = await loadTexture(context, reader, material.occlusionTexture.index)
    readTextureInfo(params, 'OcclusionMap', material.occlusionTexture)
  }
  if (material.emissiveTexture != null) {
    params.EmissionMap = await loadTexture(context, reader, material.emissiveTexture.index)
    readTextureInfo(params, 'EmissionMap', material.emissiveTexture)
  }
  if (material.emissiveFactor != null) {
    params.EmissionColor = material.emissiveFactor
  }
  if (material.alphaMode != null) {
    switch (material.alphaMode) {
      case 'BLEND':
        params.Blend = true
        break
      case 'MASK':
        if (material.alphaCutoff != null) {
          params.AlphaClip = material.alphaCutoff
        } else {
          params.AlphaClip = 0.5
        }
        break
      case 'OPAQUE':
        //
        break
    }
  }
  if (material.doubleSided) {
    params.DoubleSided = true
  }

  if (material.pbrMetallicRoughness) {
    effect = 'pbr'

    const pbr = material.pbrMetallicRoughness
    params.DiffuseColor = pbr.baseColorFactor || [1, 1, 1, 1]
    params.MetallicRoughness = [pbr.metallicFactor ?? 1, pbr.roughnessFactor ?? 1]

    if (pbr.baseColorTexture != null) {
      params.DiffuseMap = await loadTexture(context, reader, pbr.baseColorTexture.index)
      readTextureInfo(params, 'DiffuseMap', pbr.baseColorTexture)
    }
    if (pbr.metallicRoughnessTexture != null) {
      params.MetallicRoughnessMap = await loadTexture(context, reader, pbr.metallicRoughnessTexture.index)
      readTextureInfo(params, 'MetallicRoughnessMap', pbr.metallicRoughnessTexture)
    }
  }

  if (material.extensions && material.extensions[KHR_materials_pbrSpecularGlossiness]) {
    effect = 'default'

    const gloss: PbrMaterialSpecularGlossiness = material.extensions[KHR_materials_pbrSpecularGlossiness]
    params.DiffuseColor = gloss.diffuseFactor || params.DiffuseColor || [1, 1, 1, 1]
    params.SpecularColor = gloss.specularFactor || [1, 1, 1]
    params.Glossiness = gloss.glossinessFactor || 1

    if (gloss.diffuseTexture) {
      params.DiffuseMap = await loadTexture(context, reader, gloss.diffuseTexture.index)
      readTextureInfo(params, 'DiffuseMap', gloss.diffuseTexture)
    }
    if (gloss.specularGlossinessTexture) {
      params.SpecularMap = await loadTexture(context, reader, gloss.specularGlossinessTexture.index)
      readTextureInfo(params, 'SpecularMap', gloss.specularGlossinessTexture)
    }
  }

  if (material.extensions && material.extensions[KHR_materials_unlit]) {
    effect = 'unlit'
  }

  return {
    name: material.name,
    effect: effect,
    parameters: params,
  }
}

function readTextureInfo(params: { [k: string]: unknown }, name: string, info: TextureInfo) {
  if (info.extensions && info.extensions[KHR_texture_transform]) {
    const transform = info.extensions[KHR_texture_transform] as TextureTransform
    const offsetScale = [1, 1, 0, 0]
    if (transform.scale) {
      offsetScale[0] = transform.scale[0]
      offsetScale[1] = transform.scale[1]
    }
    if (transform.offset) {
      offsetScale[2] = transform.offset[0] || 0
      offsetScale[3] = transform.offset[1] || 0
    }
    if (transform.offset || transform.scale) {
      params[name + 'ScaleOffset'] = offsetScale
    }
  }
  if (info.texCoord > 0) {
    params[name + 'Coord'] = info.texCoord
  }
}

async function loadTexture(context: PipelineContext, reader: DocumentReader, index: number) {
  return reader.loadTexture(index, async (texture, sampler, image) => {
    if (image.uri) {
      return context.manager.device.createTexture({
        data: resolveUri(image.uri, context),
        samplerParams: sampler
          ? {
              minFilter: sampler.minFilter,
              magFilter: sampler.magFilter,
              wrapU: sampler.wrapS,
              wrapV: sampler.wrapT,
            }
          : null,
      })
    }
    if (image.bufferView) {
      switch (image.mimeType) {
        case 'image/png':
          // TODO:
          // context.loader.transform(ImagePng, ImageData, ..., context)
          break
        case 'image/jpeg':
        // TODO:
        // context.loader.transform(ImageJpeg, ImageData, ..., context)
        default:
      }
    }
    Log.w(`[glTF] loading image from buffer is not supported yet`)
    return null
  })
}
