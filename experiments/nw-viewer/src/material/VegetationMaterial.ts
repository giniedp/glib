import {
  BlendState,
  CommonBlocks,
  CommonInputs,
  CullState,
  Device,
  type EffectOptions,
  type MaterialOptions,
  type ShaderModuleOptions,
  TRUE,
  inputSlotScalar,
  inputSlotTexture,
  inputSlotVec3,
  materialSchemaClass,
} from '@gglib/graphics'
import { Vec3 } from '@gglib/math'
import type { NwMaterialProps } from './GltfExtension'
import WGSL from './VegetationMaterial.wgsl'
import SCHEMA from './VegetationMaterial.meta'
import { parseColorParam, smoothnessToRoughness } from './common.wgsl'

export function vegetationShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Vegetation Shader',
    wgsl: WGSL,
    glsl: null,
  }
}

export function vegetationEffectOptions(): EffectOptions {
  return {
    name: 'New World Effect',
    meta: {},
    program: {
      shader: vegetationShaderOptions(),
      sharedBlocks: [CommonBlocks.Global, CommonBlocks.View, CommonBlocks.Frame],
    },
  }
}

export class VegetationMaterial extends materialSchemaClass(SCHEMA) {
  public constructor(device: Device, options?: MaterialOptions) {
    super(device, {
      name: 'Vegetation Material',
      effect: vegetationEffectOptions(),
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

    const isImpostor = !!attr.StringGenMask?.includes('%IS_GDE_IMPOSTOR%')
    const isLeaves = !!attr.StringGenMask?.includes('LEAVES')

    if (attr.AlphaTest) {
      this.AlphaClip = attr.AlphaTest
    }

    if (tex.Diffuse) {
      this.BaseColorMap = tex.Diffuse as any
    }
    if (tex.Bumpmap) {
      this.NormalMap = tex.Bumpmap as any
    }
    if (tex.Specular) {
      this.SpecularColorMap = tex.Specular as any
    }
    if (tex.Smoothness) {
      this.SmoothnessMap = tex.Smoothness as any
      this.SmoothnessMapEnabled = TRUE
    }
    if (tex.Opacity) {
      this.OpacityMap = tex.Opacity as any
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
    this.effect.cullState = CullState.None
    this.effect.blendState = BlendState.Alpha
  }
}
