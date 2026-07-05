import {
  CommonInputs,
  CullState,
  Device,
  inputSlotSampler,
  inputSlotScalar,
  inputSlotTexture,
  inputSlotVec4,
  materialSchemaClass,
  SamplerState,
  type EffectOptions,
  type ShaderModuleOptions,
} from '@gglib/graphics'
import { Vec4 } from '@gglib/math'
import { TERRAIN_PATCH_SHADER as WGSL } from './TerrainPatchMaterial.wgsl'
import { InputBlocks, MaterialLayerMasks } from './common'

export function terrainPatchShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Terrain Patch Shader',
    wgsl: {
      source: WGSL,
    },
    glsl: null,
  }
}

export function terrainPatchEffectOptions(): EffectOptions {
  return {
    name: 'Terrain Patch Effect',
    meta: {},
    program: {
      shader: terrainPatchShaderOptions(),
      sharedBlocks: [InputBlocks.Global, InputBlocks.View, InputBlocks.Frame],
    },
  }
}

export const TerrainPatchMaterialSchema = {
  World: CommonInputs.Object.ModelMatrix,

  View: CommonInputs.View.ViewMatrix,
  Projection: CommonInputs.View.ProjectionMatrix,
  CameraPosition: CommonInputs.View.CameraPosition,

  Lines: inputSlotScalar('material', 'lines'),

  MountainHeight: inputSlotScalar('material', 'mountainHeight'),

  HeightMapUvTransform: inputSlotVec4('material', 'heightMapUvTransform'),
  HeightMapUvTransformCoarse: inputSlotVec4('material', 'heightMapUvTransformCoarse'),

  ColorMapUvTransform: inputSlotVec4('material', 'colorMapUvTransform'),
  ColorMapUvTransformCoarse: inputSlotVec4('material', 'colorMapUvTransformCoarse'),
  ColorLayer: inputSlotScalar('material', 'colorLayer'),
  ColorLayerCoarse: inputSlotScalar('material', 'colorLayerCoarse'),

  HeightMap: inputSlotTexture('material', 'heightMap'),
  ColorMap1: inputSlotTexture('material', 'colorMap1'),
  ColorMap2: inputSlotTexture('material', 'colorMap2'),

  HeightMapSampler: inputSlotSampler('material', 'heightMapSampler'),
  ColorMapSampler: inputSlotSampler('material', 'colorMapSampler'),
}

export class TerrainPatchMaterial extends materialSchemaClass(TerrainPatchMaterialSchema) {
  public constructor(device: Device) {
    super(device, {
      name: 'Terrain Patch Material',
      effect: terrainPatchEffectOptions(),
      meta: {},
    })

    this.layer = MaterialLayerMasks.Terrain
    this.HeightMapSampler = SamplerState.LinearClamp
    this.ColorMapSampler = SamplerState.LinearClamp
    this.MountainHeight = 2048

    this.HeightMapUvTransform = Vec4.create(1, 1, 0, 0)
    this.HeightMapUvTransformCoarse = Vec4.create(1, 1, 0, 0)
    this.ColorMapUvTransform = Vec4.create(1, 1, 0, 0)
    this.ColorMapUvTransformCoarse = Vec4.create(1, 1, 0, 0)

    this.effect.cullState = CullState.None
  }
}
