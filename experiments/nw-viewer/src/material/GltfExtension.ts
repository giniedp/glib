import type { AcquireTextureOptions, Texture, TextureOptions } from '@gglib/graphics'
import type { GLTF } from '@gglib/loaders'
import { DistanceCloudsMaterial } from './DistanceCloudsMaterial'
import { NewWorldMaterial } from './NewWorldMaterial'
import { TerrainCompositeMaterial } from './TerrainCompositeMaterial'
import type { TexMod } from './TexMod'

export interface NwMaterialExtensionData {
  attrs: NwMaterialAttrs
  params: Record<string, number | string>
  textures: GLTF.TextureInfo[]
}

export interface NwTextureExtensionData {
  Map: TexMapName
  TexMod?: TexMod
}

export interface NwMaterialAttrs {
  Name?: string
  GenMask?: string
  Shader?: string
  StringGenMask?: string
  MtlFlags?: number

  AlphaTest?: number
  CloakAmount?: number
  Opacity?: number
  Shininess?: number
  Diffuse?: string // r,g,b string
  Emissive?: string // r,g,b string
  Emittance?: string // r,g,b string
  Specular?: string // r,g,b string
}

export const EXT_nw_mtl = 'EXT_nw_mtl'
export const EXT_nw_tex = 'EXT_nw_tex'

export const NwMaterialExtension: GLTF.GltfMaterialExtension = {
  name: EXT_nw_mtl,
  handler: (container, node, mtl) => {
    const data = mtl.extensions[EXT_nw_mtl] as NwMaterialExtensionData
    if (!data) {
      return
    }

    const props = node.data.properties as NwMaterialProps
    props.mods = {}
    props.textures = {}
    props.attrs = {
      ...(data.attrs || {}),
    }
    props.params = {
      ...(data.params || {}),
    }

    data.textures.forEach((tex) => {
      const texNode = container.textureNode(tex.index)
      const texData = tex.extensions[EXT_nw_tex] as NwTextureExtensionData
      container.graph.assign(node, texNode, (material, texture) => {
        const params = material.properties as NwMaterialProps
        params.textures[texData.Map] = texture
        if (texData.TexMod) {
          params.mods[texData.Map] = texData.TexMod
        }
      })
    })

    switch (data.attrs.Shader) {
      case 'Terraintilecomposite': {
        node.data.factory = (device, asset) => new TerrainCompositeMaterial(device, asset)
        break
      }
      case 'Illum':
      case 'Vegetation': {
        node.data.factory = (device, asset) => new NewWorldMaterial(device, asset)
        break
      }
      case 'Distanceclouds': {
        node.data.factory = (device, options) => new DistanceCloudsMaterial(device, options)
        break
      }
      default: {
        console.log('Unknown shader', data.attrs.Shader)
      }
    }

    if (!node.data.factory) {
      node.data.factory = (device, asset) => new NewWorldMaterial(device, asset)
    }
  },
}

export type NwMaterialProps = {
  attrs: NwMaterialAttrs
  textures: Partial<Record<TexMapName, Texture | TextureOptions | AcquireTextureOptions>>
  mods: Partial<Record<TexMapName, TexMod>>
  params: Record<string, number | string>
}

export type TexMapName =
  | 'Bumpmap'
  | 'Custom'
  | 'Decal'
  | 'Detail'
  | 'Diffuse'
  | 'Emittance'
  | 'Environment'
  | 'Heightmap'
  | 'Occlusion'
  | 'Opacity'
  | 'SecondSmoothness'
  | 'Smoothness'
  | 'Specular'
  | 'Specular2'
  | 'SubSurface'
  | '[1] Custom'
  | '[2] Custom'
  | '[3] Custom'
  | '[4] Custom'
  | '[5] Custom'
  | '[5] Smoothness'
