import { CommonMaterialProps } from '@gglib/graphics'
import { GltfMaterialExtension } from './asset'
import {
  getKhrExtension,
  KHR_materials_ior,
  KHR_materials_pbrSpecularGlossiness,
  KHR_materials_specular,
} from './format/KHR-Extensions'

function setParam(params: CommonMaterialProps, key: keyof CommonMaterialProps, value: any) {
  if (value != null) {
    params[key] = value
  }
}

export const KhrMaterialsPbrSpecularGlossinessHandler: GltfMaterialExtension = {
  name: KHR_materials_pbrSpecularGlossiness,
  handler: (container, node, mtl) => {
    const ext = getKhrExtension(mtl, KHR_materials_pbrSpecularGlossiness)

    const params: CommonMaterialProps = node.data.properties
    params.BaseColor = ext.diffuseFactor || params.BaseColor || [1, 1, 1, 1]
    params.SpecularColor = ext.specularFactor || params.SpecularColor || [1, 1, 1]
    params.Roughness = 1.0 - (ext.glossinessFactor ?? 1)
    params.IOR = 0 // TODO: remove once assets use IOR extension

    if (ext.diffuseTexture) {
      container.graph.assign(node, container.textureNode(ext.diffuseTexture.index), (material, texture) => {
        setParam(material.properties, 'BaseColorMap', texture)
        // readTextureInfo(params, 'BaseColorMap', ext.diffuseTexture)
      })
    }

    if (ext.specularGlossinessTexture) {
      container.graph.assign(node, container.textureNode(ext.specularGlossinessTexture.index), (material, texture) => {
        setParam(material.properties, 'SpecularColorMap', texture)
        setParam(material.properties, 'SmoothnessMap', texture)
        material.meta.SmoothnessMapChannel = 'a'
        // readTextureInfo(params, 'SpecularColorMap', ext.specularGlossinessTexture)
      })
    }
  },
}

export const KhrMaterialsSpecular: GltfMaterialExtension = {
  name: KHR_materials_specular,
  handler: (container, node, mtl) => {
    const ext = getKhrExtension(mtl, KHR_materials_specular)

    const params: CommonMaterialProps = node.data.properties
    params.SpecularColor = ext.specularColorFactor || params.SpecularColor || [1, 1, 1]

    if (ext.specularColorTexture) {
      container.graph.assign(node, container.textureNode(ext.specularColorTexture.index), (material, texture) => {
        setParam(material.properties, 'SpecularColorMap', texture)
        // readTextureInfo(params, 'SpecularColorMap', ext.specularColorTexture)
      })
    }
    params.Roughness = 1.0 - (ext.specularFactor ?? 1.0)
  },
}

export const KhrMaterialsIor: GltfMaterialExtension = {
  name: KHR_materials_ior,
  handler: (container, node, mtl) => {
    const ext = getKhrExtension(mtl, KHR_materials_ior)

    const params: CommonMaterialProps = node.data.properties
    params.IOR ??= ext.ior ?? 1.5
  },
}
