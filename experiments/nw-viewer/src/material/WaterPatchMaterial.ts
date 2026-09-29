import {
  BlendState,
  CullState,
  MaterialWithSchema,
  SamplerState,
  type EffectOptions,
  type ShaderModuleOptions,
} from '@gglib/graphics'
import { vec3 } from '@gglib/math'
import { InputBlocks } from './common'
import SCHEMA from './WaterPatchMaterial.meta'
import WGSL from './WaterPatchMaterial.wgsl'

export function waterPatchShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Water Patch Shader',
    wgsl: {
      source: WGSL,
    },
    glsl: null,
  }
}

export function waterPatchEffectOptions(): EffectOptions {
  return {
    name: 'Water Patch Effect',
    meta: {},
    program: {
      shader: waterPatchShaderOptions(),
      sharedBlocks: [InputBlocks.Global, InputBlocks.View, InputBlocks.Frame, InputBlocks.Lights],
    },
  }
}

export class WaterPatchMaterial extends MaterialWithSchema(SCHEMA) {
  protected override configure(): void {
    super.configure({
      name: 'Water Patch Material',
      effect: waterPatchEffectOptions(),
      meta: {},
    })
    this.HeightMapSampler = SamplerState.LinearClamp

    this.ShallowColor = vec3(0.05, 0.45, 0.4)
    this.DeepColor = vec3(0.01, 0.08, 0.25)
    this.WaterLevel = 40.0
    this.DepthScale = 15.0 // 15 m for full deep blen
    this.Roughness = 0.15
    this.ReflectStrength = 0.9
    this.RefractStrength = 0.25
    this.ShoreFade = 5 // 1.5 m transitio
    this.FoamDepth = 2.0 // foam within 2 m of shor
    this.FoamStrength = 2.5
    this.FoamSpeed = 0.3 // m/s scrol
    this.WaveSpeed = 10.6 // m/s propagatio
    this.WaveScale = 0.5 // ~420 m wavelengt
    this.WaveHeight = 0.15
    this.MountainHeight = 2048
    this.WaterHeight = 40

    this.effect.cullState = CullState.None
    this.effect.blendState = BlendState.Alpha
  }
}
