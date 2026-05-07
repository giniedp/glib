import {
  CommonBindingKeys,
  Device,
  materialSchema,
  materialSchemaClass,
  SamplerState,
  Texture,
  type EffectOptions,
  type ShaderModuleOptions,
} from '@gglib/graphics'
import { Mat4, Vec3, Vec4 } from '@gglib/math'
import { WATER_PATCH_SHADER } from './WaterPatchShader.wgsl'

export function waterPatchShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Water Patch Shader',
    wgsl: WATER_PATCH_SHADER,
    glsl: null,
  }
}

export function waterPatchEffectOptions(): EffectOptions {
  return {
    name: 'Water Patch Effect',
    meta: {},
    program: {
      shader: waterPatchShaderOptions(),
      shared: [],
    },
  }
}

export type WaterPatchEffectInputs = {
  [CommonBindingKeys.Object.ModelMatrix]: Mat4
  [CommonBindingKeys.View.ViewMatrix]: Mat4
  [CommonBindingKeys.View.ProjectionMatrix]: Mat4
  [CommonBindingKeys.View.CameraPosition]: Vec3
  [CommonBindingKeys.Frame.ElapsedTime]: number

  'material.shallowColor': Vec3
  'material.deepColor': Vec3
  'material.depthScale': number
  'material.roughness': number
  'material.reflectStrength': number
  'material.refractStrength': number
  'material.shoreDepth': number
  'material.shoreFade': number
  'material.foamDepth': number
  'material.foamStrength': number
  'material.foamSpeed': number
  'material.waveSpeed': number
  'material.waveScale': number
  'material.waveHeight': number

  'material.heightMapUvTransform': Vec4
  'material.MountainHeight': number
  'material.HeightMapSize': number

  'lights.color[0]': Vec4
  'lights.position[0]': Vec4
  'lights.direction[0]': Vec4
  'lights.color[1]': Vec4
  'lights.position[1]': Vec4
  'lights.direction[1]': Vec4
  'lights.color[2]': Vec4
  'lights.position[2]': Vec4
  'lights.direction[2]': Vec4
  'lights.color[3]': Vec4
  'lights.position[3]': Vec4
  'lights.direction[3]': Vec4

  'fog.color': Vec3
  'fog.start': number
  'fog.end': number

  heightMap: Texture
  // texture1Map: Texture
  // texture2Map: Texture
}

export function waterPatchEffectParameters(): WaterPatchEffectInputs {
  return {
    [CommonBindingKeys.Object.ModelMatrix]: Mat4.createIdentity(),
    [CommonBindingKeys.View.ViewMatrix]: Mat4.createIdentity(),
    [CommonBindingKeys.View.ProjectionMatrix]: Mat4.createIdentity(),
    [CommonBindingKeys.View.CameraPosition]: Vec3.create(),
    [CommonBindingKeys.Frame.ElapsedTime]: 0,

    'material.shallowColor': Vec3.create(0.05, 0.45, 0.4), // murky teal-green
    'material.deepColor': Vec3.create(0.01, 0.08, 0.25), // dark navy
    'material.depthScale': 15.0, // 15 m of water column for full deep blend
    'material.roughness': 0.15, // fairly glassy
    'material.reflectStrength': 0.9,
    'material.refractStrength': 0.25,
    'material.shoreDepth': 35.0, // heightmap value where water begins
    'material.shoreFade': 1.5, // ~1.5 m fade width at the waterline
    'material.foamDepth': 2.0, // foam in first 2 m of water
    'material.foamStrength': 0.75,
    'material.foamSpeed': 0.04,
    'material.waveSpeed': 0.6,
    'material.waveScale': 0.015, // ~400 m wavelength on a 2048 m map
    'material.waveHeight': 0.4, // 40 cm peak displacement

    'material.heightMapUvTransform': Vec4.create(1, 1, 0, 0),
    'material.MountainHeight': 2048,
    'material.HeightMapSize': 256,

    'lights.color[0]': Vec4.create(),
    'lights.position[0]': Vec4.create(),
    'lights.direction[0]': Vec4.create(),
    'lights.color[1]': Vec4.create(),
    'lights.position[1]': Vec4.create(),
    'lights.direction[1]': Vec4.create(),
    'lights.color[2]': Vec4.create(),
    'lights.position[2]': Vec4.create(),
    'lights.direction[2]': Vec4.create(),
    'lights.color[3]': Vec4.create(),
    'lights.position[3]': Vec4.create(),
    'lights.direction[3]': Vec4.create(),

    'fog.color': Vec3.create(0.5, 0.5, 0.5),
    'fog.start': 0,
    'fog.end': 100,
    heightMap: null,
    // texture1Map: null,
    // texture2Map: null,
  }
}

export const WaterPatchMaterialSchema = materialSchema<WaterPatchEffectInputs>()({
  World: CommonBindingKeys.Object.ModelMatrix,
  View: CommonBindingKeys.View.ViewMatrix,
  Projection: CommonBindingKeys.View.ProjectionMatrix,
  CameraPosition: CommonBindingKeys.View.CameraPosition,
  ElapsedTime: CommonBindingKeys.Frame.ElapsedTime,

  ShallowColor: 'material.shallowColor',
  DeepColor: 'material.deepColor',
  DepthScale: 'material.depthScale',
  Roughness: 'material.roughness',
  ReflectStrength: 'material.reflectStrength',
  RefractStrength: 'material.refractStrength',
  ShoreDepth: 'material.shoreDepth',
  ShoreFade: 'material.shoreFade',
  FoamDepth: 'material.foamDepth',
  FoamStrength: 'material.foamStrength',
  FoamSpeed: 'material.foamSpeed',
  WaveSpeed: 'material.waveSpeed',
  WaveScale: 'material.waveScale',
  WaveHeight: 'material.waveHeight',

  HeightMapUvTransform: 'material.heightMapUvTransform',
  MountainHeight: 'material.MountainHeight',
  HeightMapSize: 'material.HeightMapSize',

  HeightMap: 'heightMap',
})

export class WaterPatchMaterial extends materialSchemaClass(WaterPatchMaterialSchema) {
  public constructor(device: Device) {
    super(device, {
      name: 'Water Patch Material',
      effect: waterPatchEffectOptions(),
      inputs: waterPatchEffectParameters(),
      meta: {},
    })

    this.set('heightMapSampler' as any, SamplerState.LinearClamp)
  }
}
