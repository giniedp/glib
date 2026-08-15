import { ResourceNode } from '@gglib/content'
import { CommonMaterialProps, MaterialOptions } from '@gglib/graphics'
import type { GltfAssetContainer } from './asset'
import { getTextureUvInfo } from './load-texture'

export function loadMaterial(container: GltfAssetContainer, index: number) {
  const graph = container.graph

  // glTF primitives may omit `material`, meaning "use the default material"
  if (index == null) {
    return container.defaultMaterialNode()
  }

  // Check if the material node already exists in the graph
  const key = `material:${index}`
  if (graph.has(key)) {
    return graph.get(key) as ResourceNode<MaterialOptions>
  }

  // get raw material data from gltf document
  const gltf = container.document.materials?.[index]
  if (!gltf) {
    throw new Error(`Material with index ${index} not found in document`)
  }
  const node = graph.node<MaterialOptions>(key, {
    properties: {},
  })

  const params: CommonMaterialProps = node.data.properties

  if (gltf.alphaMode === 'MASK') {
    params.AlphaClip = gltf.alphaCutoff ?? 0.5
    params.AlphaBlend = true
  } else if (gltf.alphaMode === 'BLEND') {
    params.AlphaClip = gltf.alphaCutoff ?? 0
    params.AlphaBlend = true
  } else {
    params.AlphaClip = gltf.alphaCutoff ?? 0
  }

  if (gltf.doubleSided) {
    params.DoubleSided = true
  }

  if (gltf.emissiveFactor) {
    params.EmissiveColor = gltf.emissiveFactor
  }

  if (gltf.emissiveTexture) {
    params.EmissiveMapSampler = container.getTextureSampler(gltf.emissiveTexture.index)
    graph.assign(node, container.textureNode(gltf.emissiveTexture.index), (material, texture) => {
      ;(material.properties as CommonMaterialProps).EmissiveMap = texture
    })
  }

  if (gltf.occlusionTexture) {
    params.OcclusionMapSampler = container.getTextureSampler(gltf.occlusionTexture.index)
    graph.assign(node, container.textureNode(gltf.occlusionTexture.index), (material, texture) => {
      ;(material.properties as CommonMaterialProps).OcclusionMap = texture
    })
  }

  if (gltf.normalTexture) {
    params.NormalMapSampler = container.getTextureSampler(gltf.normalTexture.index)
    graph.assign(node, container.textureNode(gltf.normalTexture.index), (material, texture) => {
      ;(material.properties as CommonMaterialProps).NormalMap = texture
    })
  }

  if (gltf.pbrMetallicRoughness) {
    const pbr = gltf.pbrMetallicRoughness
    params.BaseColor = pbr.baseColorFactor || params.BaseColor || [1, 1, 1, 1]
    params.Metallic = pbr.metallicFactor ?? 1
    params.Roughness = pbr.roughnessFactor ?? 1

    if (pbr.baseColorTexture) {
      params.BaseMapSampler = container.getTextureSampler(pbr.baseColorTexture.index)
      params.BaseMapUv = getTextureUvInfo(pbr.baseColorTexture)
      graph.assign(node, container.textureNode(pbr.baseColorTexture.index), (material, texture) => {
        ;(material.properties as CommonMaterialProps).BaseMap = texture
      })
    }

    if (pbr.metallicRoughnessTexture) {
      params.MetallicRoughnessMapSampler = container.getTextureSampler(pbr.metallicRoughnessTexture.index)
      graph.assign(node, container.textureNode(pbr.metallicRoughnessTexture.index), (material, texture) => {
        ;(material.properties as CommonMaterialProps).MetallicRoughnessMap = texture
      })
    }
  }

  container.applyExtensions(node, gltf)

  return node
}
