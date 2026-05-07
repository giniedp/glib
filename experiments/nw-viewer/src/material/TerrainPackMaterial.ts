import {
  Device,
  materialSchema,
  materialSchemaClass,
  SamplerState,
  type EffectOptions,
  type ShaderModuleOptions,
  type Texture,
} from '@gglib/graphics'
import { TERRAIN_PACK_SHADER } from './TerrainPackShader.wgsl'

export function terrainPackShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Terrain Pack Shader',
    wgsl: TERRAIN_PACK_SHADER,
    glsl: null,
  }
}

export function terrainPackEffectOptions(): EffectOptions {
  return {
    name: 'Terrain Pack Effect',
    meta: {},
    program: {
      shader: terrainPackShaderOptions(),
      shared: [],
    },
  }
}

export type SplatPackEffectInputs = {
  tileSampler: SamplerState
  tile1Map: Texture
  tile2Map: Texture
  tile3Map: Texture
}

export function terrainPackEffectInputs(): SplatPackEffectInputs {
  return {
    tileSampler: SamplerState.LinearClamp,
    tile1Map: null,
    tile2Map: null,
    tile3Map: null,
  }
}

export const TerrainPackMaterialSchema = materialSchema<SplatPackEffectInputs>()({
  Tile1Map: 'tile1Map',
  Tile2Map: 'tile2Map',
  Tile3Map: 'tile3Map',
})

export class SplatPackMaterial extends materialSchemaClass(TerrainPackMaterialSchema) {
  public constructor(device: Device) {
    super(device, {
      name: 'Terrain Pack Material',
      effect: terrainPackEffectOptions(),
      inputs: terrainPackEffectInputs(),
      meta: {},
    })
  }
}
