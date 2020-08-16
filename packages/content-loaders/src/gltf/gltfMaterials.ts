import { resolveUri, PipelineContext } from '@gglib/content'
import { MaterialOptions, Material } from '@gglib/graphics'

import {
  GLTFTextureInfo,
  GLTFTextureTransform,
  KHR_texture_transform,
  KHR_materials_unlit,
  KHR_materials_pbrSpecularGlossiness,
  GLTFPbrMaterialSpecularGlossiness,
} from './format'
import { GLTFReader } from './reader'

export async function loadGltfMaterials(
  context: PipelineContext,
  reader: GLTFReader,
) {
  return Promise.all(reader.doc.materials.map((mtl, i) => loadGltfMaterial(context, reader, i, {})))
}

export async function loadGltfMaterial(
  context: PipelineContext,
  reader: GLTFReader,
  materialIndex: number,
  features: { [key: string]: any},
): Promise<Material> {
  return reader.loadMaterial(materialIndex, JSON.stringify(features), async (material) => {
    const params = {
      ...features,
    }

    let technique = 'default'

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
    switch (material.alphaMode) {
      case 'BLEND':
        params.Blend = true
        break
      case 'MASK':
        params.Blend = false
        if (material.alphaCutoff != null) {
          params.AlphaClip = material.alphaCutoff
        } else {
          params.AlphaClip = 0.5
        }
        break
      case 'OPAQUE':
        params.Blend = false
        break
    }
    if (material.doubleSided) {
      params.DoubleSided = true
    }

    if (material.extensions && material.extensions[KHR_materials_pbrSpecularGlossiness]) {
      technique = 'default'

      const ext: GLTFPbrMaterialSpecularGlossiness = material.extensions[KHR_materials_pbrSpecularGlossiness]
      params.DiffuseColor = ext.diffuseFactor // || [1, 1, 1, 1]
      params.SpecularColor = ext.specularFactor // || [1, 1, 1]
      params.Glossiness = ext.glossinessFactor // || 1

      if (ext.diffuseTexture) {
        params.DiffuseMap = await loadTexture(context, reader, ext.diffuseTexture.index)
        readTextureInfo(params, 'DiffuseMap', ext.diffuseTexture)
      }
      if (ext.specularGlossinessTexture) {
        params.SpecularMap = await loadTexture(context, reader, ext.specularGlossinessTexture.index)
        readTextureInfo(params, 'SpecularMap', ext.specularGlossinessTexture)
      }
    } else if (material.pbrMetallicRoughness) {
      technique = 'pbr'

      const pbr = material.pbrMetallicRoughness
      if (pbr.baseColorFactor != null) {
        params.DiffuseColor = pbr.baseColorFactor
      }
      if (pbr.metallicFactor != null || pbr.roughnessFactor != null) {
        params.MetallicRoughness = [pbr.metallicFactor ?? 1, pbr.roughnessFactor ?? 1]
      }
      if (pbr.baseColorTexture != null) {
        params.DiffuseMap = await loadTexture(context, reader, pbr.baseColorTexture.index)
        readTextureInfo(params, 'DiffuseMap', pbr.baseColorTexture)
      }
      if (pbr.metallicRoughnessTexture != null) {
        params.MetallicRoughnessMap = await loadTexture(context, reader, pbr.metallicRoughnessTexture.index)
        readTextureInfo(params, 'MetallicRoughnessMap', pbr.metallicRoughnessTexture)
      }
    }

    if (material.extensions && material.extensions[KHR_materials_unlit]) {
      technique = 'unlit'
    }

    const mtlOptions: MaterialOptions = {
      name: material.name,
      technique: technique,
      parameters: params,
    }
    return context.pipeline.run(Material.Options, Material, mtlOptions, context)
  })
}

function readTextureInfo(params: { [k: string]: unknown }, name: string, info: GLTFTextureInfo) {
  if (info.extensions && info.extensions[KHR_texture_transform]) {
    const transform = info.extensions[KHR_texture_transform] as GLTFTextureTransform
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

async function loadTexture(context: PipelineContext, reader: GLTFReader, index: number) {
  return reader.loadTexture(index, async (texture, sampler, image) => {
    let uri = null
    if (image.uri) {
      uri = image.uri
    }
    if (image.bufferView != null) {
      const view = await reader.loadBufferView(image.bufferView)
      const array = new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
      const blob = new Blob([array], { type: image.mimeType })
      uri = URL.createObjectURL(blob)
    }
    return context.manager.device.createTexture({
      source: resolveUri(image.uri, context),
      samplerParams: sampler
        ? {
            minFilter: sampler.minFilter,
            magFilter: sampler.magFilter,
            wrapU: sampler.wrapS,
            wrapV: sampler.wrapT,
          }
        : null,
    })
  })
}
