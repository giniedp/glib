import {
  CommonBindingKeys,
  Device,
  materialSchema,
  materialSchemaClass,
  SamplerState,
  type EffectOptions,
  type ShaderModuleOptions,
  type Texture,
} from '@gglib/graphics'
import { Mat4, Vec3, Vec4 } from '@gglib/math'
import { LOD_RANGE_FACTOR, MOUNTAIN_HEIGHT, QUAD_LEAF_SIZE } from '../constants'
import { TERRAIN_PATCH_SHADER } from './TerrainPatchShader.wgsl'

export function terrainPatchShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Terrain Patch Shader',
    wgsl: TERRAIN_PATCH_SHADER,
    glsl: null,
  }
}

export function terrainPatchEffectOptions(): EffectOptions {
  return {
    name: 'Terrain Patch Effect',
    meta: {},
    instanceBufferKey: 'instances',
    program: {
      shader: terrainPatchShaderOptions(),
      shared: [],
    },
  }
}

export type TerrainPatchEffectInputs = {
  [CommonBindingKeys.Object.ModelMatrix]: Mat4
  [CommonBindingKeys.View.ViewMatrix]: Mat4
  [CommonBindingKeys.View.ProjectionMatrix]: Mat4
  [CommonBindingKeys.View.CameraPosition]: Vec3

  'material.normalScale': number
  'material.mountainHeight': number
  'material.lines': number

  'material.patchSize': number
  'material.baseFactor': number
  'material.morphLod': number

  'material.heightMapUvTransform': Vec4
  'material.heightMapUvTransformCoarse': Vec4

  'material.colorMapUvTransform': Vec4
  'material.colorMapUvTransformCoarse': Vec4
  'material.colorLayer': number
  'material.colorLayerCoarse': number

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

  heightMap: Texture
  colorMap1: Texture
  colorMap2: Texture
}

export function terrainPatchEffectInputs(): TerrainPatchEffectInputs {
  return {
    [CommonBindingKeys.Object.ModelMatrix]: Mat4.createIdentity(),
    [CommonBindingKeys.View.ViewMatrix]: Mat4.createIdentity(),
    [CommonBindingKeys.View.ProjectionMatrix]: Mat4.createIdentity(),
    [CommonBindingKeys.View.CameraPosition]: Vec3.create(),

    'material.normalScale': 1,
    'material.mountainHeight': MOUNTAIN_HEIGHT,
    'material.lines': 0,

    'material.patchSize': QUAD_LEAF_SIZE,
    'material.baseFactor': LOD_RANGE_FACTOR,
    'material.morphLod': 0,

    'material.heightMapUvTransform': Vec4.create(1, 1, 0, 0),
    'material.heightMapUvTransformCoarse': Vec4.create(1, 1, 0, 0),

    'material.colorMapUvTransform': Vec4.create(1, 1, 0, 0),
    'material.colorMapUvTransformCoarse': Vec4.create(1, 1, 0, 0),
    'material.colorLayer': 0,
    'material.colorLayerCoarse': 0,

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

    heightMap: null,
    colorMap1: null,
    colorMap2: null,
  }
}

export const TerrainPatchMaterialSchema = materialSchema<TerrainPatchEffectInputs>()({
  World: CommonBindingKeys.Object.ModelMatrix,
  View: CommonBindingKeys.View.ViewMatrix,
  Projection: CommonBindingKeys.View.ProjectionMatrix,
  CameraPosition: CommonBindingKeys.View.CameraPosition,

  Lines: 'material.lines',
  BaseFactor: 'material.baseFactor',
  PatchSize: 'material.patchSize',

  MorphLod: 'material.morphLod',
  MountainHeight: 'material.mountainHeight',
  NormalScale: 'material.normalScale',

  HeightMapUvTransform: 'material.heightMapUvTransform',
  HeightMapUvTransformCoarse: 'material.heightMapUvTransformCoarse',

  ColorMapUvTransform: 'material.colorMapUvTransform',
  ColorMapUvTransformCoarse: 'material.colorMapUvTransformCoarse',
  ColorLayer: 'material.colorLayer',
  ColorLayerCoarse: 'material.colorLayerCoarse',

  HeightMap: 'heightMap',
  ColorMap1: 'colorMap1',
  ColorMap2: 'colorMap2',
})

export class TerrainPatchMaterial extends materialSchemaClass(TerrainPatchMaterialSchema) {
  public constructor(device: Device) {
    super(device, {
      name: 'Terrain Patch Material',
      effect: terrainPatchEffectOptions(),
      inputs: terrainPatchEffectInputs(),
      meta: {},
    })

    this.set('heightMapSampler' as any, SamplerState.LinearClamp)
    this.set('colorMapSampler' as any, SamplerState.LinearClamp)
  }

  public setDirectionalLight(index: 0 | 1 | 2 | 3, color: Vec3, direction: Vec3) {
    this.get(`lights.color[${index}]`).initFrom(color).setW(1)
    this.get(`lights.direction[${index}]`).initFrom(direction).setW(0)
  }

  public setPointLight(index: 0 | 1 | 2 | 3, color: Vec3, position: Vec3, range: number) {
    this.get(`lights.color[${index}]`).initFrom(color).setW(2)
    this.get(`lights.position[${index}]`).initFrom(position).setW(range)
  }
}
