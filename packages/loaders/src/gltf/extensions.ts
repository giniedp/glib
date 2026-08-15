import { CommonMaterialProps } from '@gglib/graphics'
import { GltfMaterialExtension } from './asset'
import {
  getKhrExtension,
  KHR_materials_clearcoat,
  KHR_materials_emissive_strength,
  KHR_materials_ior,
  KHR_materials_iridescence,
  KHR_materials_pbrSpecularGlossiness,
  KHR_materials_specular,
} from './format/KHR-Extensions'
import { getTextureUvInfo as getTextureInfo } from './load-texture'

function setParam(params: CommonMaterialProps, key: keyof CommonMaterialProps, value: any) {
  if (value != null) {
    params[key as any] = value
  }
}

export const KhrMaterialsPbrSpecularGlossinessHandler: GltfMaterialExtension = {
  name: KHR_materials_pbrSpecularGlossiness,
  handler: (asset, node, mtl) => {
    const ext = getKhrExtension(mtl, KHR_materials_pbrSpecularGlossiness)

    const params: CommonMaterialProps = node.data.properties
    params.BaseColor = ext.diffuseFactor || params.BaseColor || [1, 1, 1, 1]
    params.SpecularColor = ext.specularFactor || params.SpecularColor || [1, 1, 1]
    params.Roughness = 1.0 - (ext.glossinessFactor ?? 1)
    params.Metallic = 0
    params.IOR = 0

    if (ext.diffuseTexture) {
      const sampler = asset.getTextureSampler(ext.diffuseTexture.index)
      const uvInfo = getTextureInfo(ext.diffuseTexture)
      asset.graph.assign(node, asset.textureNode(ext.diffuseTexture.index), (material, texture) => {
        setParam(material.properties, 'BaseMap', texture)
        setParam(material.properties, 'BaseMapSampler', sampler)
        setParam(material.properties, 'BaseMapUv', uvInfo)
      })
    }

    if (ext.specularGlossinessTexture) {
      const sampler = asset.getTextureSampler(ext.specularGlossinessTexture.index)
      asset.graph.assign(node, asset.textureNode(ext.specularGlossinessTexture.index), (material, texture) => {
        setParam(material.properties, 'SpecularMap', texture)
        setParam(material.properties, 'SpecularMapSampler', sampler)
        setParam(material.properties, 'SmoothnessMap', texture)
        setParam(material.properties, 'SmoothnessMapSampler', sampler)
      })
    }
  },
}

export const KhrMaterialsSpecular: GltfMaterialExtension = {
  name: KHR_materials_specular,
  handler: (asset, node, mtl) => {
    const ext = getKhrExtension(mtl, KHR_materials_specular)

    const params: CommonMaterialProps = node.data.properties
    params.SpecularColor = ext.specularColorFactor || params.SpecularColor || [1, 1, 1]
    params.SpecularWeight = ext.specularFactor ?? 1.0

    if (ext.specularColorTexture) {
      const sampler = asset.getTextureSampler(ext.specularColorTexture.index)
      asset.graph.assign(node, asset.textureNode(ext.specularColorTexture.index), (material, texture) => {
        setParam(material.properties, 'SpecularMap', texture)
        setParam(material.properties, 'SpecularMapSampler', sampler)
      })
    }
    if (ext.specularTexture) {
      const sampler = asset.getTextureSampler(ext.specularTexture.index)
      asset.graph.assign(node, asset.textureNode(ext.specularTexture.index), (material, texture) => {
        setParam(material.properties, 'SmoothnessMap', texture)
        setParam(material.properties, 'SmoothnessMapSampler', sampler)
      })
    }
  },
}

export const KhrMaterialsIor: GltfMaterialExtension = {
  name: KHR_materials_ior,
  handler: (asset, node, mtl) => {
    const ext = getKhrExtension(mtl, KHR_materials_ior)

    const params: CommonMaterialProps = node.data.properties
    params.IOR ??= ext?.ior ?? 1.5
  },
}

export const KhrMaterialsEmissiveStrength: GltfMaterialExtension = {
  name: KHR_materials_ior,
  handler: (asset, node, mtl) => {
    const ext = getKhrExtension(mtl, KHR_materials_emissive_strength)

    const params: CommonMaterialProps = node.data.properties
    params.EmissiveStrength ??= ext?.emissiveStrength ?? 1
  },
}
