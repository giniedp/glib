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
import { HEIGHTMAP_TILE_SIZE, LOD_RANGE_FACTOR, MOUNTAIN_HEIGHT, QUAD_LEAF_SIZE } from '../constants'
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

  'material.baseColor': Vec3
  'material.specularColor': Vec3
  'material.roughness': number
  'material.normalScale': number
  'material.mountainHeight': number
  'material.lines': number

  'material.patchSize': number
  'material.baseFactor': number
  'material.morphLod': number
  'material.heightMapSize': number

  'material.heightMapUvTransform': Vec4
  'material.heightMapUvTransformCoarse': Vec4

  'material.colorMapUvTransform': Vec4
  'material.colorMapUvTransformCoarse': Vec4

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
  heightMapCoarse: Texture

  colorMap1: Texture
  colorMap1Coarse: Texture

  colorMap2: Texture
  colorMap2Coarse: Texture
}

export function terrainPatchEffectInputs(): TerrainPatchEffectInputs {
  return {
    [CommonBindingKeys.Object.ModelMatrix]: Mat4.createIdentity(),
    [CommonBindingKeys.View.ViewMatrix]: Mat4.createIdentity(),
    [CommonBindingKeys.View.ProjectionMatrix]: Mat4.createIdentity(),
    [CommonBindingKeys.View.CameraPosition]: Vec3.create(),
    'material.baseColor': Vec3.create(1, 1, 1),
    'material.specularColor': Vec3.create(1, 1, 1),
    'material.roughness': 0.5,
    'material.normalScale': 1,
    'material.mountainHeight': MOUNTAIN_HEIGHT,
    'material.lines': 0,

    'material.patchSize': QUAD_LEAF_SIZE,
    'material.baseFactor': LOD_RANGE_FACTOR,
    'material.morphLod': 0,
    'material.heightMapSize': HEIGHTMAP_TILE_SIZE,

    'material.heightMapUvTransform': Vec4.create(1, 1, 0, 0),
    'material.heightMapUvTransformCoarse': Vec4.create(1, 1, 0, 0),

    'material.colorMapUvTransform': Vec4.create(1, 1, 0, 0),
    'material.colorMapUvTransformCoarse': Vec4.create(1, 1, 0, 0),

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
    heightMapCoarse: null,

    colorMap1: null,
    colorMap1Coarse: null,

    colorMap2: null,
    colorMap2Coarse: null,
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
  HeightMapSize: 'material.heightMapSize',

  HeightMapUvTransform: 'material.heightMapUvTransform',
  HeightMapUvTransformCoarse: 'material.heightMapUvTransformCoarse',

  ColorMapUvTransform: 'material.colorMapUvTransform',
  ColorMapUvTransformCoarse: 'material.colorMapUvTransformCoarse',

  HeightMap: 'heightMap',
  HeightMapCoarse: 'heightMapCoarse',

  ColorMap1: 'colorMap1',
  ColorMap1Coarse: 'colorMap1Coarse',

  ColorMap2: 'colorMap2',
  ColorMap2Coarse: 'colorMap2Coarse',
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
