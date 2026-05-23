import {
  BlendState,
  CommonBlocks,
  CullState,
  Device,
  type EffectOptions,
  type MaterialOptions,
  type ShaderModuleOptions,
  TRUE,
  materialSchemaClass,
} from '@gglib/graphics'
import type { NwMaterialProps } from './GltfExtension'
import SCHEMA from './NewWorldMaterial.meta'
import WGSL from './NewWorldMaterial.wgsl'
import { parseColorParam, smoothnessToRoughness } from './common.wgsl'
import { Vec3 } from '@gglib/math'

export function newWorldShaderOptions(): ShaderModuleOptions {
  return {
    name: 'New World Shader',
    wgsl: WGSL,
    glsl: null,
  }
}

export function newWorldEffectOptions(): EffectOptions {
  return {
    name: 'New World Effect',
    meta: {},
    program: {
      shader: newWorldShaderOptions(),
      sharedBlocks: [CommonBlocks.Global, CommonBlocks.View, CommonBlocks.Frame],
    },
  }
}

export class NewWorldMaterial extends materialSchemaClass(SCHEMA) {
  public constructor(device: Device, options?: MaterialOptions) {
    super(device, {
      name: 'New World Material',
      effect: newWorldEffectOptions(),
      meta: {},
    })
    this.BaseColor = Vec3.create(1, 1, 1)
    this.EmissiveColor = Vec3.create()
    this.SpecularColor = Vec3.create()
    // this.Metallic = 0
    this.Roughness = 0.5
    this.Alpha = 1
    this.AlphaClip = 0
    this.Ior = 0
    this.assignNwProps(options?.properties as any)
  }

  public assignNwProps(props: NwMaterialProps) {
    if (!props) {
      return
    }
    const attr = props.attrs
    const para = props.params
    const tex = props.textures
    const mod = props.mods
    // console.log(attr, para)

    if (attr.AlphaTest) {
      this.AlphaClip = attr.AlphaTest
    }
    // console.log(props)
    // if (params['g_macroDiffuseSaturation']) {
    //   this.MacroSaturation = Number(params['g_macroDiffuseSaturation'])
    // }
    // if (params['g_macroBlendStrength']) {
    //   this.MacroBlendStrength = Number(params['g_macroBlendStrength'])
    // }
    // if (params['g_macroGlossBlendStrength']) {
    //   this.MacroGlossBlendStrength = Number(params['g_macroGlossBlendStrength'])
    // }

    // if (params['g_materialLayerBlendFactor']) {
    //   this.MaterialBlendFactor = Number(params['g_materialLayerBlendFactor'])
    // }
    // if (params['g_materialLayerBlendFalloff']) {
    //   this.MaterialBlendFalloff = Number(params['g_materialLayerBlendFalloff'])
    // }
    // if (params['g_materialLayerHeightOffset']) {
    //   this.MaterialHeightOffset = Number(params['g_materialLayerHeightOffset'])
    // }
    // if (params['g_materialLayerHeightScale']) {
    //   this.MaterialHeightScale = Number(params['g_materialLayerHeightScale'])
    // }

    if (tex.Diffuse) {
      this.BaseColorMap = tex.Diffuse as any
      this.TextureEnabled = TRUE
    }
    if (tex.Bumpmap) {
      this.NormalMap = tex.Bumpmap as any
      this.NormalEnabled = TRUE
    }
    if (tex.Specular) {
      this.SpecularColorMap = tex.Specular as any
      this.SpecularEnabled = TRUE
    }
    if (tex.Smoothness) {
      this.SmoothnessMap = tex.Smoothness as any
      this.SmoothnessMapEnabled = TRUE
    }

    if (attr.Diffuse) {
      this.BaseColor = parseColorParam(attr.Diffuse)
    }
    if (attr.Specular) {
      this.SpecularColor = parseColorParam(attr.Specular)
    }
    if (attr.Emissive) {
      this.EmissiveColor = parseColorParam(attr.Emissive)
    }
    if (attr.Emittance) {
      this.EmissiveColor = parseColorParam(attr.Emittance)
    }
    if (attr.Shininess) {
      this.Roughness = smoothnessToRoughness(attr.Shininess / 255)
    }

    this.Ior = 0
    if (attr.Shader === 'Vegetation') {
      this.effect.cullState = CullState.None
      this.effect.blendState = BlendState.Alpha
    } else {
      this.effect.cullState = CullState.CullBack
      this.effect.blendState = BlendState.Opaque
    }
  }
}
