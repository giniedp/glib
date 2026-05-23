import {
  CommonBlocks,
  Device,
  materialSchemaClass,
  SamplerState,
  type EffectOptions,
  type ShaderModuleOptions,
} from '@gglib/graphics'
import { Vec3 } from '@gglib/math'
import SCHEMA from './WaterPatchMaterial.meta'
import WGSL from './WaterPatchMaterial.wgsl'

export function waterPatchShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Water Patch Shader',
    wgsl: WGSL,
    glsl: null,
  }
}

export function waterPatchEffectOptions(): EffectOptions {
  return {
    name: 'Water Patch Effect',
    meta: {},
    instanceBufferKey: 'instances',
    program: {
      shader: waterPatchShaderOptions(),
      sharedBlocks: [CommonBlocks.Global, CommonBlocks.View, CommonBlocks.Frame],
    },
  }
}

export class WaterPatchMaterial extends materialSchemaClass(SCHEMA) {
  public constructor(device: Device) {
    super(device, {
      name: 'Water Patch Material',
      effect: waterPatchEffectOptions(),
      meta: {},
    })
    this.HeightMapSampler = SamplerState.LinearClamp

    this.ShallowColor = Vec3.create(0.05, 0.45, 0.4)
    this.DeepColor = Vec3.create(0.01, 0.08, 0.25)
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
  }
}
