import type { AcquireTextureOptions, Texture, TextureOptions } from '@gglib/graphics'
import type { GLTF } from '@gglib/loaders'
import { DistanceCloudsMaterial } from './DistanceCloudsMaterial'
import { FxMeshAdvancedMaterial } from './FxMeshAdvancedMaterial'
import { FxMeshAdvancedTranspMaterial } from './FxMeshAdvancedTranspMaterial'
import { GeometryBeamMaterial } from './GeometryBeamMaterial'
import { GeometryBeamSimpleMaterial } from './GeometryBeamSimpleMaterial'
import { GeometryFogMaterial } from './GeometryfogMaterial'
import { GlassMaterial } from './GlassMaterial'
import { IllumMaterial } from './IllumMaterial'
import { MeshparticleMaterial } from './MeshparticleMaterial'
import { NowDrawMaterial } from './NoDrawMaterial'
import { ParticleImposterMaterial } from './ParticleImposterMaterial'
import { TerrainCompositeMaterial } from './TerrainCompositeMaterial'
import type { TexMod } from './TexMod'
import { UnknownMaterial } from './UnknownMaterial'
import { VegetationMaterial } from './VegetationMaterial'
import { Vec4, type IVec4 } from '@gglib/math'

export interface NwMaterialExtensionData {
  attrs: NwMaterialAttrs
  params: Record<string, number | string>
  textures: GLTF.TextureInfo[]
  vertexDeform: VertexDeform
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
  Diffuse?: number[] // r,g,b string
  Emissive?: number[] // r,g,b string
  Emittance?: number[] // r,g,b string
  Specular?: number[] // r,g,b string
}

export interface VertexDeform {
  Type: number
  DividerX: number
  DividerY: number
  NoiseScale: string
  WaveX: WaveX
}

export interface WaveX {
  Type: number
  Amp: number
  Level: number
  Phase: number
  Freq: number
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
    if (data.vertexDeform) {
      props.vertexDeform = JSON.parse(JSON.stringify(data.vertexDeform))
    }

    data.textures?.forEach((tex) => {
      if (tex.index < 0) {
        console.warn('Invalid texture index', tex.index, tex)
        return
      }
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
    const shaderName = data.attrs.Shader?.toLocaleLowerCase()
    // console.count(shaderName)
    switch (shaderName) {
      case 'terraintilecomposite': {
        node.data.factory = (device, asset) => new TerrainCompositeMaterial(device, asset)
        break
      }
      case 'illum': {
        node.data.factory = (device, asset) => new IllumMaterial(device, asset)
        break
      }
      case 'glass': {
        node.data.factory = (device, asset) => new GlassMaterial(device, asset)
        break
      }
      case 'nodraw': {
        node.data.factory = (device) => new NowDrawMaterial(device)
        break
      }
      case 'fxmeshadvanced': {
        node.data.factory = (device, asset) => new FxMeshAdvancedMaterial(device, asset)
        break
      }
      case 'fxmeshadvancedtransp': {
        node.data.factory = (device, asset) => new FxMeshAdvancedTranspMaterial(device, asset)
        break
      }
      case 'geometrybeam': {
        node.data.factory = (device, asset) => new GeometryBeamMaterial(device, asset)
        break
      }
      case 'geometrybeamsimple': {
        node.data.factory = (device, asset) => new GeometryBeamSimpleMaterial(device, asset)
        break
      }
      case 'geometryfog': {
        node.data.factory = (device, asset) => new GeometryFogMaterial(device, asset)
        break
      }
      case 'vegetation': {
        node.data.factory = (device, asset) => new VegetationMaterial(device, asset)
        break
      }
      case 'distanceclouds': {
        node.data.factory = (device, options) => new DistanceCloudsMaterial(device, options)
        break
      }
      case 'meshparticle': {
        node.data.factory = (device, options) => new MeshparticleMaterial(device, options)
        break
      }
      case 'particleimposter': {
        node.data.factory = (device, options) => new ParticleImposterMaterial(device, options)
        break
      }
      default: {
        console.warn('Unknown shader', data.attrs.Shader, data.attrs.StringGenMask)
        node.data.factory = (device, asset) => new UnknownMaterial(device)
      }
    }

    if (!node.data.factory) {
      node.data.factory = (device, asset) => new IllumMaterial(device, asset)
    }
  },
}

export type NwMaterialProps = {
  attrs: NwMaterialAttrs
  textures: Partial<Record<TexMapName, Texture | TextureOptions | AcquireTextureOptions>>
  mods: Partial<Record<TexMapName, TexMod>>
  params: Record<string, number | string>
  vertexDeform: VertexDeform
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
