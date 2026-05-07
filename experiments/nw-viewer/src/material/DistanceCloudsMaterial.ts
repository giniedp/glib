import {
  BlendState,
  CullState,
  DepthState,
  Device,
  materialSchema,
  materialSchemaClass,
  SamplerState,
  type AcquireTextureOptions,
  type EffectOptions,
  type MaterialOptions,
  type ShaderModuleOptions,
  type Texture,
  type TextureOptions,
} from '@gglib/graphics'
import { DISTANCE_CLOUDS_SHADER } from './DistanceCloudsShader.wgsl'
import type { NwMaterialAttrs, TexMapName } from './GltfExtension'
import type { TexMod } from './TexMod'

export function distanceCloudsOptions(): ShaderModuleOptions {
  return {
    name: 'Distance Clouds Shader',
    wgsl: DISTANCE_CLOUDS_SHADER,
    glsl: null,
  }
}

export function distanceCloudsEffectOptions(): EffectOptions {
  return {
    name: 'Distance Clouds Effect',
    meta: {},
    program: {
      shader: distanceCloudsOptions(),
      shared: [],
    },
  }
}

export type DistanceCloudsEffectInputs = {
  baseColorSampler: SamplerState
  baseColorMap: Texture
}

export function distanceCloudsEffectInputs(): DistanceCloudsEffectInputs {
  return {
    baseColorSampler: SamplerState.LinearClamp,
    baseColorMap: null,
  }
}

export const DistanceCloudsMaterialSchema = materialSchema<DistanceCloudsEffectInputs>()({
  BaseColorMap: 'baseColorMap',
})

export type DistanceCloudsProps = {
  attrs: NwMaterialAttrs
  textures: Partial<Record<TexMapName, Texture | TextureOptions | AcquireTextureOptions>>
  mods: Partial<Record<TexMapName, TexMod>>
  params: {
    AlphaSaturation: '1'
    Attenuation: '0.60000002'
    MaxShadowDensity: '1'
    MinShadowDensity: '0'
    ShadowFadingInclinationFactor: '10'
    ShadowFadingRadiusFactor: '10'
    ShadowPower: '1'
    ShadowSkydomeSize: '1000'
    SkyColorMultiplier: '8'
    StepSize: '0.0099999998'
    SunColorMultiplier: '2'
  }
}

export class DistanceCloudsMaterial extends materialSchemaClass(DistanceCloudsMaterialSchema) {
  public constructor(device: Device, options?: MaterialOptions) {
    super(device, {
      name: 'Distance Clouds Material',
      effect: distanceCloudsEffectOptions(),
      inputs: distanceCloudsEffectInputs(),
      meta: {},
    })
    this.effect.cullState = CullState.None
    this.effect.depthState = DepthState.GreaterEqualNoWrite
    this.effect.blendState = BlendState.Alpha
    console.log('Distance Clouds Options', options)
    this.assignNwProps(options?.properties as any)
  }

  public assignNwProps(props: DistanceCloudsProps) {
    if (!props) {
      return
    }
    const attr = props.attrs
    const para = props.params
    const tex = props.textures
    const mod = props.mods
    console.log({ mod })

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
      this.set('baseColorMap', tex.Diffuse)
    }
  }
}
