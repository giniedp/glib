import {
  BlendState,
  CommonBlocks,
  CullState,
  DepthState,
  Device,
  type EffectOptions,
  type MaterialOptions,
  SamplerState,
  type ShaderModuleOptions,
  TRUE,
  materialSchemaClass,
} from '@gglib/graphics'
import { Vec3 } from '@gglib/math'
import type { NwMaterialProps } from './GltfExtension'
import SCHEMA from './NewWorldMaterial.meta'
import WGSL from './NewWorldMaterial.wgsl'
import { TextureModifier } from './TexMod'
import { parseColorParam, smoothnessToRoughness } from './common.wgsl'

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
      perInstanceTransformBlock: 'object',
    },
  }
}

export class NewWorldMaterial extends materialSchemaClass(SCHEMA) {
  private mod1: TextureModifier | null = null
  private mod2: TextureModifier | null = null
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
    this.TextureSampler = SamplerState.LinearWrap
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

    // console.log(Object.keys(tex).sort())
    if (tex.Bumpmap) {
      this.NormalMap = tex.Bumpmap as any
      this.NormalEnabled = TRUE
    }
    if (tex.Decal) {
      // TODO:
    }
    if (tex.Detail) {
      // TODO:
    }
    if (tex.Custom) {
      // TODO:
    }
    if (tex.Diffuse) {
      this.BaseColorMap = tex.Diffuse as any
      this.TextureEnabled = TRUE
    }
    if (tex.Emittance) {
      // TODO:
    }
    if (tex.Heightmap) {
      // TODO:
    }
    if (tex.Occlusion) {
      // TODO:
    }

    if (tex.Smoothness) {
      this.SmoothnessMap = tex.Smoothness as any
      this.SmoothnessMapEnabled = TRUE
    }
    if (tex.SecondSmoothness) {
      // TODO:
    }

    if (tex.Specular) {
      this.SpecularColorMap = tex.Specular as any
      this.SpecularEnabled = TRUE
    }
    if (tex.Specular2) {
      // TODO:
    }
    if (tex.SubSurface) {
      // TODO:
    }
    if (tex['[1] Custom']) {
      // TODO:
    }

    // console.log(Object.keys(attr).sort())
    if (attr.AlphaTest) {
      this.AlphaClip = attr.AlphaTest
    }
    if (attr.Opacity) {
      this.Alpha = attr.Opacity
    }
    if (attr.Diffuse) {
      this.BaseColor = parseColorParam(attr.Diffuse)
    }
    if (attr.Emittance) {
      this.EmissiveColor = parseColorParam(attr.Emittance)
    }
    if (attr.Specular) {
      this.SpecularColor = parseColorParam(attr.Specular)
    }
    if (attr.Emissive) {
      this.EmissiveColor = parseColorParam(attr.Emissive)
    }
    if (attr.Shininess) {
      this.Roughness = smoothnessToRoughness(attr.Shininess / 255)
    }

    //
    // Texture Modifiers
    //

    if (mod.Diffuse && TextureModifier.isModified(mod.Diffuse)) {
      this.mod1 = new TextureModifier(mod.Diffuse)
      this.updateMod1(0)
      this.UvTransform1Enabled = TRUE
    }

    if (mod.Custom && TextureModifier.isModified(mod.Custom)) {
      this.mod2 = new TextureModifier(mod.Custom)
      this.updateMod2(0)
      this.UvTransform2Enabled = TRUE
    }

    if (attr.StringGenMask.includes('%DECAL')) {
      this.effect.depthState = DepthState.GreaterEqualNoWrite
    } else {
      this.effect.depthState = DepthState.GreaterEqual
    }
    if (attr.Opacity < 1) {
      this.effect.cullState = CullState.None
      this.effect.blendState = BlendState.Alpha
    } else {
      this.effect.cullState = CullState.CullBack
      this.effect.blendState = BlendState.Opaque
    }
  }

  private frame: number
  public update(time: number, delta: number, frame: number) {
    if (this.frame === frame) {
      return
    }

    if (this.mod1 && this.mod1.isAnimated) {
      this.updateMod1(time)
    }

    if (this.mod2 && this.mod2.isAnimated) {
      this.updateMod2(time)
    }
  }

  private updateMod1(time: number) {
    this.mod1.update(time)
    this.UvTransform1 = this.mod1.matrix
  }

  private updateMod2(time: number) {
    this.mod2.update(time)
    this.UvTransform2 = this.mod2.matrix
  }
}
