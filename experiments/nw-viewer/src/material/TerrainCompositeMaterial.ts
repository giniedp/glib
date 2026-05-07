import {
  Device,
  materialSchema,
  materialSchemaClass,
  SamplerState,
  type EffectOptions,
  type MaterialOptions,
  type ShaderModuleOptions,
  type Texture,
} from '@gglib/graphics'
import { Vec4 } from '@gglib/math'
import { parseColorParam, parseNumberParam, smoothnessToRoughness } from './common.wgsl'
import type { NwMaterialProps } from './GltfExtension'
import { TERRAIN_COMPOSITE_SHADER } from './TerrainCompositeShader.wgsl'

export function splatComposeShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Terrain Composite Shader',
    wgsl: TERRAIN_COMPOSITE_SHADER,
    glsl: null,
  }
}

export function splatComposeEffectOptions(): EffectOptions {
  return {
    name: 'Terrain Composite Effect',
    meta: {},
    program: {
      shader: splatComposeShaderOptions(),
      shared: [],
    },
  }
}

export type SplatComposeEffectInputs = {
  'params.regionScaleOffset': Vec4
  'params.tilingScaleOffset': Vec4
  'params.tiling': number

  'params.baseColor': Vec4
  'params.specularColor': Vec4
  'params.debugColor': Vec4
  'params.roughness': number

  'params.macroSaturation': number
  'params.macroBlendStrength': number
  'params.macroGlossBlendStrength': number
  'params.macroGlossScale': number
  'params.macroNormalScale': number

  'params.materialBlendFactor': number
  'params.materialBlendFalloff': number
  'params.materialHeightScale': number
  'params.materialHeightOffset': number

  macroSampler: SamplerState
  macroBaseMap: Texture
  macroNormalMap: Texture
  macroGlossMap: Texture
  materialSampler: SamplerState
  splatMap: Texture
  baseMap: Texture
  normalMap: Texture
  heightMap: Texture
  specularMap: Texture
  smoothnessMap: Texture
}

export function splatComposeEffectInputs(): SplatComposeEffectInputs {
  return {
    'params.regionScaleOffset': Vec4.create(1, 1, 0, 0),
    'params.tilingScaleOffset': Vec4.create(1, 1, 0, 0),
    'params.tiling': 1,

    'params.baseColor': Vec4.create(1, 1, 1, 1),
    'params.specularColor': Vec4.create(1, 1, 1, 1),
    'params.debugColor': Vec4.create(0, 0, 0, 0),
    'params.roughness': 1,

    'params.macroSaturation': 1,
    'params.macroBlendStrength': 1,
    'params.macroGlossBlendStrength': 1,
    'params.macroGlossScale': 1,
    'params.macroNormalScale': 1,

    'params.materialBlendFactor': 1,
    'params.materialBlendFalloff': 1,
    'params.materialHeightScale': 1,
    'params.materialHeightOffset': 0,

    macroSampler: SamplerState.LinearWrap,
    macroBaseMap: null,
    macroNormalMap: null,
    macroGlossMap: null,
    materialSampler: SamplerState.LinearWrap,
    splatMap: null,
    baseMap: null,
    normalMap: null,
    heightMap: null,
    specularMap: null,
    smoothnessMap: null,
  }
}

export const SplatComposeSchema = materialSchema<SplatComposeEffectInputs>()({
  RegionScaleOffset: 'params.regionScaleOffset',
  TilingScaleOffset: 'params.tilingScaleOffset',
  Tiling: 'params.tiling',

  BaseColor: 'params.baseColor',
  SpecularColor: 'params.specularColor',
  MacroBaseMap: 'macroBaseMap',
  MacroNormalMap: 'macroNormalMap',
  MacroGlossMap: 'macroGlossMap',
  SplatMap: 'splatMap',
  BaseMap: 'baseMap',
  NormalMap: 'normalMap',
  HeightMap: 'heightMap',
  SpecularMap: 'specularMap',
  SmoothnessMap: 'smoothnessMap',

  Roughness: 'params.roughness',

  MacroSaturation: 'params.macroSaturation',
  MacroBlendStrength: 'params.macroBlendStrength',
  MacroGlossBlendStrength: 'params.macroGlossBlendStrength',
  MacroGlossScale: 'params.macroGlossScale',
  MacroNormalScale: 'params.macroNormalScale',

  MaterialBlendFactor: 'params.materialBlendFactor',
  MaterialBlendFalloff: 'params.materialBlendFalloff',
  MaterialHeightScale: 'params.materialHeightScale',
  MaterialHeightOffset: 'params.materialHeightOffset',
})

type CompositeParams = {
  g_macroBlendStrength: string
  g_macroDiffuseSaturation: string
  g_macroGlossBlendStrength: string
  g_materialLayerBlendFactor: string
  g_materialLayerBlendFalloff: string
  g_materialLayerHeightOffset: string
  g_materialLayerHeightScale: string
}

type CompositeAttrs = {
  AlphaTest: 0
  Diffuse: string
  Emittance: string
  GenMask: string
  MtlFlags: number
  Opacity: number
  Shader: 'Terraintilecomposite'
  Shininess: number
  Specular: string
}

export class TerrainCompositeMaterial extends materialSchemaClass(SplatComposeSchema) {
  public constructor(device: Device, options?: MaterialOptions) {
    super(device, {
      name: 'Terrain Composite Material',
      effect: splatComposeEffectOptions(),
      inputs: splatComposeEffectInputs(),
      meta: {},
    })
    if (options?.properties) {
      this.assignNwProps(options?.properties as any)
    }
  }

  public assignNwProps(props: NwMaterialProps) {
    if (!props) {
      return
    }
    const attr = props.attrs as CompositeAttrs
    const para = props.params as CompositeParams
    const tex = props.textures

    this.MacroSaturation = parseNumberParam(para?.g_macroDiffuseSaturation) ?? 0
    this.MacroBlendStrength = parseNumberParam(para?.g_macroBlendStrength) ?? 0
    this.MacroGlossBlendStrength = parseNumberParam(para?.g_macroGlossBlendStrength) ?? 0
    this.MaterialBlendFactor = parseNumberParam(para?.g_materialLayerBlendFactor) ?? 1
    this.MaterialBlendFalloff = parseNumberParam(para?.g_materialLayerBlendFalloff) ?? 0
    this.MaterialHeightOffset = parseNumberParam(para?.g_materialLayerHeightOffset) ?? 0
    this.MaterialHeightScale = parseNumberParam(para?.g_materialLayerHeightScale) ?? 1

    if (tex?.Diffuse) {
      this.set('baseMap', tex.Diffuse)
    }
    if (tex?.Bumpmap) {
      this.set('normalMap', tex.Bumpmap)
    }
    if (tex?.Specular) {
      this.set('specularMap', tex.Specular)
    }
    if (tex?.Smoothness) {
      this.set('smoothnessMap', tex.Smoothness)
    }
    if (tex?.Heightmap) {
      this.set('heightMap', tex.Heightmap)
    }

    this.BaseColor.initFrom(parseColorParam(attr?.Diffuse) ?? Vec4.createOne())
    this.SpecularColor.initFrom(parseColorParam(attr?.Specular) ?? Vec4.createOne())
    if (attr?.Emittance) {
      // console.log('Emittance', attr.Emittance)
      // this.EmissiveColor.initFrom(parseColor(attr.Emittance))
    }
    if (attr?.Shininess >= 0) {
      this.Roughness = smoothnessToRoughness(attr.Shininess / 255)
    }
    this.Tiling = props.mods.Diffuse?.TileU ?? 1
  }
}
