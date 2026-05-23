import {
  Device,
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
import Schema from './TerrainCompositeMaterial.meta'
import TERRAIN_COMPOSITE_SHADER from './TerrainCompositeMaterial.wgsl'

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
      sharedBlocks: [],
    },
  }
}

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

export class TerrainCompositeMaterial extends materialSchemaClass(Schema) {
  public constructor(device: Device, options?: MaterialOptions) {
    super(device, {
      name: 'Terrain Composite Material',
      effect: splatComposeEffectOptions(),
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
    this.MaterialSampler = SamplerState.LinearWrap

    if (tex?.Diffuse) {
      this.BaseMap = tex.Diffuse as Texture
    }
    if (tex?.Bumpmap) {
      this.NormalMap = tex.Bumpmap as Texture
    }
    if (tex?.Specular) {
      this.SpecularMap = tex.Specular as Texture
    }
    if (tex?.Smoothness) {
      this.SmoothnessMap = tex.Smoothness as Texture
    }
    if (tex?.Heightmap) {
      this.HeightMap = tex.Heightmap as Texture
    }

    this.BaseColor = parseColorParam(attr?.Diffuse) ?? Vec4.createOne()
    this.SpecularColor = parseColorParam(attr?.Specular) ?? Vec4.createOne()
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
