import { imageFromBlob, ResourceNode } from '@gglib/content'
import { CommonUvInfo, TextureOptions } from '@gglib/graphics'
import { GltfAssetContainer } from './asset'
import { TextureInfo } from './format'
import { getKhrExtension } from './format/KHR-Extensions'

export function loadTexture(asset: GltfAssetContainer, index: number): ResourceNode<TextureOptions> {
  const graph = asset.graph
  // Check if the node already exists in the graph
  const key = `texture:${index}`
  if (graph.has(key)) {
    return graph.get(key)!
  }

  // get raw texture data from gltf document
  const gltf = asset.document.textures[index]
  if (!gltf) {
    throw new Error(`Texture with index ${index} not found in document`)
  }

  const node = graph.node<TextureOptions>(key, {})
  const imageRef = graph.dependency(node, loadImage(asset, gltf.source))
  node.buildAsync = async (ctx, n, get) => {
    const image = get(imageRef)
    return {
      ...image,
    }
  }

  asset.applyExtensions(node, gltf)

  return node
}

function loadImage(asset: GltfAssetContainer, index: number): ResourceNode<TextureOptions> {
  const graph = asset.graph
  // Check if the node already exists in the graph
  const key = `image:${index}`
  if (graph.has(key)) {
    return graph.get(key)!
  }

  // get raw image data from gltf document
  const gltf = asset.document.images[index]
  if (!gltf) {
    throw new Error(`Image with index ${index} not found in document`)
  }

  if (gltf.uri) {
    const node = graph.node<TextureOptions>(key, { name: gltf.name })
    node.buildAsync = async (ctx) => {
      const url = ctx.content.resolveUrl(gltf.uri, asset.url, ctx.baseUrl)
      const container = await ctx.content.load(url, ctx)
      return container.loadTexture(0, ctx)
    }
    return node
  }

  if (typeof gltf.bufferView === 'number') {
    const node = graph.node<TextureOptions>(key, { name: gltf.name })
    const view = asset.document.bufferViews[gltf.bufferView]
    const bufferKey = graph.dependency(node, asset.bufferNode(view.buffer))
    node.buildAsync = (_, n, get): Promise<TextureOptions> => {
      const buffer = get(bufferKey)
      const array = new Uint8Array(buffer, view.byteOffset, view.byteLength)
      const blob = new Blob([array], { type: gltf.mimeType })
      return imageFromBlob(blob)
    }
    return node
  }

  throw new Error(`Image with index ${index} has neither uri nor bufferView`)
}

export function getTextureUvInfo(info: TextureInfo): CommonUvInfo {
  const mod = getKhrExtension(info, 'KHR_texture_transform')

  if (!mod?.offset && !mod?.rotation && !mod?.scale && !info.texCoord) {
    return null
  }

  return {
    index: info.texCoord ?? 0,
    offset: mod?.offset ?? [0, 0],
    rotation: mod?.rotation ?? 0,
    scale: mod?.scale ?? [1, 1],
  }
}
